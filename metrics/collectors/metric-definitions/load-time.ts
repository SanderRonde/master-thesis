import * as fs from 'fs-extra';

import { generateTempFileName } from '../shared/helpers';
import { info } from '../shared/log';
import {
	KEEP_PROFILES,
	LOAD_TIME_PERFORMANCE_MEASURES,
	SLOWDOWN_FACTOR_LOAD_TIME,
} from '../shared/settings';
import { LoadTime } from '../shared/types';
import { getDatasetStats } from '../shared/stats';
import { readFile } from '../shared/files';
import { createPage } from './render-time';
import {
	doWithServer,
	startServer,
} from '../shared/dashboard/serve-dashboard-dist';

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
	port: number,
	rootPath: string = '/index.html'
): Promise<PerformanceProfile> {
	const { page, browser } = await createPage();

	const client = await page.target().createCDPSession();
	await client.send('Emulation.setCPUThrottlingRate', {
		rate: SLOWDOWN_FACTOR_LOAD_TIME,
	});

	const profilePath = await generateTempFileName('json');
	await page.tracing.start({
		path: profilePath,
	});
	await page.goto(`http://localhost:${port}${rootPath}`);
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

export async function setupLoadTimeMeasuringForDir(
	onDone: (data: LoadTime) => Promise<void>,
	dirName: string,
	fileName: string = 'index.bundle.js',
	rootPath?: string
): Promise<(() => Promise<void>)[]> {
	const { port, stop } = await startServer(0, dirName);

	const profiles: PerformanceProfile[] = [];
	return new Array(LOAD_TIME_PERFORMANCE_MEASURES).fill('').map(() => {
		return async () => {
			profiles.push(await createPerformanceProfile(port, rootPath));

			if (profiles.length === LOAD_TIME_PERFORMANCE_MEASURES) {
				const loadTimes = profiles.map((profile) =>
					getBundleLoadTimeFromProfile(port, profile, fileName)
				);
				await onDone({
					values: loadTimes,
					stats: getDatasetStats(loadTimes),
				});
				stop();
			}
		};
	});
}

export function getLoadTimeForDir(
	dirName: string,
	fileName: string = 'index.bundle.js',
	rootPath?: string
): Promise<LoadTime> {
	info('load-time', 'Starting server');
	return doWithServer(0, dirName, async (port) => {
		const profiles: PerformanceProfile[] = [];
		for (let i = 0; i < LOAD_TIME_PERFORMANCE_MEASURES; i++) {
			info(
				'load-time',
				`Creating performance profile for iteration ${
					i + 1
				}/${LOAD_TIME_PERFORMANCE_MEASURES}`
			);
			profiles.push(await createPerformanceProfile(port, rootPath));
		}

		info('load-time', 'Extracting load times');
		const loadTimes = profiles.map((profile) =>
			getBundleLoadTimeFromProfile(port, profile, fileName)
		);

		return {
			values: loadTimes,
			stats: getDatasetStats(loadTimes),
		};
	});
}
