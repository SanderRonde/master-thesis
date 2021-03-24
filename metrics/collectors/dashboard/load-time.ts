import * as path from 'path';
import { createServer } from 'http-server';
import * as fs from 'fs-extra';
import puppeteer from 'puppeteer';

import { DASHBOARD_DIR } from '../shared/constants';
import {
	generateTempFileName,
	getFreePort,
	runFunctionIfCalledFromScript,
	wait,
} from '../shared/helpers';
import { storeData } from '../shared/storage';
import {
	LOAD_TIME_PERFORMANCE_MEASURES,
	SLOWDOWN_FACTOR,
} from '../shared/settings';
import { LoadTime } from '../shared/types';
import { getDatasetStats } from '../shared/stats';
import { info } from '../shared/log';

const DASHBOARD_DIST_DIR = path.join(DASHBOARD_DIR, 'dist', 'dashboard');

interface PerformanceProfile {
	traceEvents: PerformanceEvent[];
	metadata: Record<string, unknown>;
}

interface PerformanceEvent<A = any> {
	cat: string;
	/**
	 * Note that this is in microseconds
	 */
	dur: number;
	name: string;
	ph: string;
	pid: number;
	tdur: number;
	ts: number;
	tts: number;
	args: A;
}

interface EvaluateScriptArgs {
	data: {
		columnNumber: number;
		frame: string;
		lineNumber: number;
		url: string;
	};
}

async function createPerformanceProfile(
	port: number
): Promise<PerformanceProfile> {
	const browser = await puppeteer.launch();
	const page = await browser.newPage();
	const client = await page.target().createCDPSession();
	await client.send('Emulation.setCPUThrottlingRate', {
		rate: SLOWDOWN_FACTOR,
	});

	const profilePath = await generateTempFileName('json');
	await page.tracing.start({
		path: profilePath,
	});
	await page.goto(`http://localhost:${port}/index.html`);
	await page.tracing.stop();
	await browser.close();

	const profileContents = await fs.readFile(profilePath, {
		encoding: 'utf8',
	});
	await fs.unlink(profilePath);
	return JSON.parse(profileContents);
}

function getBundleLoadTimeFromProfile(
	port: number,
	profile: PerformanceProfile
): number {
	// Look for an event with category `devtools.timeline`,
	// name `EvaluateScript` and `bundle.js` in the args
	for (const profileEntry of profile.traceEvents) {
		if (
			profileEntry.cat !== 'devtools.timeline' ||
			profileEntry.name !== 'EvaluateScript'
		) {
			continue;
		}

		const args = (profileEntry as PerformanceEvent<EvaluateScriptArgs>)
			.args;
		if (!args.data.url.includes(`://localhost:${port}/bundle.js`)) {
			continue;
		}

		return profileEntry.dur / SLOWDOWN_FACTOR / 1000;
	}

	throw new Error('Failed to find relevant profile entry');
}

export function getDashboardLoadTime(): Promise<LoadTime> {
	return new Promise<LoadTime>((resolve) => {
		const port = getFreePort();
		const server = createServer({
			root: DASHBOARD_DIST_DIR,
		});
		info(__filename, 'Starting server');
		server.listen(port, async () => {
			const profiles: PerformanceProfile[] = [];
			for (let i = 0; i < LOAD_TIME_PERFORMANCE_MEASURES; i++) {
				info(
					__filename,
					`Creating performance profile for iteration ${
						i + 1
					}/${LOAD_TIME_PERFORMANCE_MEASURES}`
				);
				profiles.push(await createPerformanceProfile(port));
			}

			info(__filename, 'Extracting load times');
			const loadTimes = profiles.map((profile) =>
				getBundleLoadTimeFromProfile(port, profile)
			);

			server.close();

			resolve({
				values: loadTimes,
				stats: getDatasetStats(loadTimes),
			});
		});
	});
}

runFunctionIfCalledFromScript(async () => {
	await storeData(
		['metrics', 'dashboard', 'load-time'],
		await getDashboardLoadTime()
	);
}, __filename);
