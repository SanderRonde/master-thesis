import { createServer } from 'http-server';
import * as fs from 'fs-extra';
import puppeteer from 'puppeteer';

import { generateTempFileName, getFreePort } from './helpers';
import { info } from './log';
import {
	KEEP_PROFILES,
	LOAD_TIME_PERFORMANCE_MEASURES,
	SLOWDOWN_FACTOR_LOAD_TIME,
} from './settings';
import { LoadTime } from './types';
import { getDatasetStats } from './stats';
import { readFile } from './files';

interface EvaluateScriptArgs {
	data: {
		columnNumber: number;
		frame: string;
		lineNumber: number;
		url: string;
	};
}

export interface PerformanceEvent<A = any> {
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

export interface PerformanceProfile {
	traceEvents: PerformanceEvent[];
	metadata: Record<string, unknown>;
}

async function createPerformanceProfile(
	port: number
): Promise<PerformanceProfile> {
	const browser = await puppeteer.launch();
	const page = await browser.newPage();
	const client = await page.target().createCDPSession();
	await client.send('Emulation.setCPUThrottlingRate', {
		rate: SLOWDOWN_FACTOR_LOAD_TIME,
	});

	const profilePath = await generateTempFileName('json');
	await page.tracing.start({
		path: profilePath,
	});
	await page.goto(`http://localhost:${port}/index.html`);
	await page.tracing.stop();
	await browser.close();

	const profileContents = await readFile(profilePath);
	if (!KEEP_PROFILES) {
		await fs.unlink(profilePath);
	}
	return JSON.parse(profileContents);
}

function getBundleLoadTimeFromProfile(
	port: number,
	profile: PerformanceProfile,
	fileName: string
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
		if (!args.data.url.includes(`://localhost:${port}/${fileName}`)) {
			continue;
		}

		return profileEntry.dur / SLOWDOWN_FACTOR_LOAD_TIME / 1000;
	}

	throw new Error('Failed to find relevant profile entry');
}

export function getLoadTimeForDir(
	dirName: string,
	fileName: string = 'index.bundle.js'
): Promise<LoadTime> {
	return new Promise<LoadTime>((resolve) => {
		const port = getFreePort();
		const server = createServer({
			root: dirName,
		});
		info('load-time', 'Starting server');
		server.listen(port, async () => {
			const profiles: PerformanceProfile[] = [];
			for (let i = 0; i < LOAD_TIME_PERFORMANCE_MEASURES; i++) {
				info(
					'load-time',
					`Creating performance profile for iteration ${
						i + 1
					}/${LOAD_TIME_PERFORMANCE_MEASURES}`
				);
				profiles.push(await createPerformanceProfile(port));
			}

			info('load-time', 'Extracting load times');
			const loadTimes = profiles.map((profile) =>
				getBundleLoadTimeFromProfile(port, profile, fileName)
			);

			server.close();

			resolve({
				values: loadTimes,
				stats: getDatasetStats(loadTimes),
			});
		});
	});
}
