import puppeteer from 'puppeteer';
import * as fs from 'fs-extra';

import { ComponentFiles } from '../dashboard/lib/get-components';
import {
	findLastIndex,
	generateTempFileName,
	getFreePort,
	wait,
} from './helpers';
import { debug, info } from './log';

import {
	KEEP_PROFILES,
	MAX_MEASURED_RENDER_WAIT_TIME,
	NAVIGATION_TIMEOUT,
	RENDER_TIME_HEIGHT,
	RENDER_TIME_MEASURES,
	RENDER_TIME_WIDTH,
	SLOWDOWN_FACTOR_RENDER_TIME,
} from './settings';
import { doWithServer } from '../dashboard/lib/render-time/serve-dashboard-dist';
import { RenderTime } from './types';
import { getDatasetStats } from './stats';
import { PerformanceEvent, PerformanceProfile } from './load-time';
import { assert } from './testing';
import { readFile } from './files';

export async function createPage() {
	const browser = await puppeteer.launch({
		timeout: NAVIGATION_TIMEOUT,
	});
	const page = await browser.newPage();
	page.setDefaultTimeout(NAVIGATION_TIMEOUT);
	page.setDefaultNavigationTimeout(NAVIGATION_TIMEOUT);

	return {
		browser,
		page,
	};
}

export async function openPage(
	port: number,
	slowdownFactor: number,
	path: string = ''
) {
	const { browser, page } = await createPage();

	await page.setViewport({
		width: RENDER_TIME_WIDTH,
		height: RENDER_TIME_HEIGHT,
	});

	const client = await page.target().createCDPSession();
	await client.send('Emulation.setCPUThrottlingRate', {
		rate: slowdownFactor,
	});
	await page.goto(`http://localhost:${port}/${path}`);

	// Wait for the page to load
	await wait(2000);

	return { page, browser };
}

async function collectComponentProfile(
	component: ComponentFiles,
	page: puppeteer.Page,
	showComponent: (
		component: ComponentFiles,
		page: puppeteer.Page
	) => Promise<void>,
	hideComponent: (
		component: ComponentFiles,
		page: puppeteer.Page
	) => Promise<void>
): Promise<PerformanceProfile> {
	const profilePath = await generateTempFileName(
		'json',
		component.js.componentName
	);

	// Start profiling
	await page.tracing.start({
		path: profilePath,
	});

	debug('render-time', '\tWaiting for page to load');

	// Wait a little while
	await wait(2000);

	// Show current component
	await showComponent(component, page);

	debug('render-time', '\tWaiting for component to render');
	await wait(MAX_MEASURED_RENDER_WAIT_TIME);

	// Stop profiling
	await page.tracing.stop();

	// Hide component
	await hideComponent(component, page);

	const profileContents = await readFile(profilePath);
	if (!KEEP_PROFILES) {
		await fs.unlink(profilePath);
	}
	return JSON.parse(profileContents);
}

type ProfileChunkEvent = PerformanceEvent<{
	data: {
		cpuProfile: {
			samples: number[];
			nodes: {
				callFrame: {
					codeType: string;
					functionName: string;
					scriptId: number;
					columnNumber?: number;
					lineNumber?: number;
					url?: string;
				};
				id: number;
				parent?: number;
			}[];
		};
		lines: number[];
		timeDeltas: number[];
	};
}>;

async function getProfileRenderTime(
	componentName: string,
	profile: PerformanceProfile
): Promise<number> {
	/**
	 * A component render starts the moment the
	 * puppeteer script is called.
	 *
	 * A component render ends when the first
	 * "composite layers" event after the
	 * last "paint" event happens. This coincides
	 * with the last complete frame re-paint after
	 * the initial render and basically signifies
	 * the last time the browser has to "change"
	 * anything in the view. Note that we don't use
	 * just the last "composite layers" event. This
	 * is because some events that don't require any
	 * redrawing can still require layer compositing.
	 * For example the `ModularChartComponent` in the
	 * 30MHz design library uses apache echarts, which
	 * uses canvas. After being rendered, this
	 * component continuously composites layers every
	 * animation frame. Since this is a continuous
	 * process that never ends, it's not part of the
	 * rendering sequence. So we need to exclude this.
	 * The difference with the event we describe above
	 * is that this time there is no paint event. So
	 * nothing actually changes, it's just a layer
	 * composite. We use this to our advantage
	 * to find the event we want, namely the one that
	 * has a "paint" event before it.
	 */

	const startEvent = profile.traceEvents.find((event) => {
		if (
			event.ph !== 'P' ||
			event.cat !== 'disabled-by-default-v8.cpu_profiler' ||
			event.name !== 'ProfileChunk'
		) {
			return false;
		}

		for (const cpuProfileNode of (event as ProfileChunkEvent)?.args?.data
			?.cpuProfile?.nodes || []) {
			if (
				cpuProfileNode.callFrame.url?.includes(
					'__puppeteer_evaluation_script__'
				)
			) {
				return true;
			}
		}

		return false;
	});

	assert(!!startEvent, `Failed to find start event for ${componentName}`);

	const lastPaintEventIndex = findLastIndex(profile.traceEvents, (event) => {
		return event.name === 'Paint';
	});

	assert(
		lastPaintEventIndex !== -1,
		`Failed to find last paint event for ${componentName}`
	);

	const stopEvent = profile.traceEvents
		.slice(lastPaintEventIndex)
		.find((event) => {
			return event.name === 'CompositeLayers';
		});

	assert(
		!!stopEvent,
		`Failed to find last CompositeLayers event for ${componentName}`
	);

	const microsendsDiff = stopEvent.ts - startEvent.ts;
	assert(
		microsendsDiff > 0,
		'Stop event is before start event, are you sure your MAX_MEASURED_RENDER_WAIT_TIME is high enough?'
	);
	return microsendsDiff / 1000;
}

async function collectRuntimeRenderTimes({
	components,
	hideComponent,
	showComponent,
	urlPath = '',
	port,
}: RenderTimeSettings & {
	port: number;
}): Promise<Map<string, number>> {
	const times: Map<string, number> = new Map();

	for (let i = 0; i < components.length; i++) {
		const component = components[i];
		info(
			'render-time',
			`\tCapturing render times for ${component.js.componentName} (${
				i + 1
			}/${components.length})`
		);

		debug('render-time', '\tOpening page');
		const { page, browser } = await openPage(
			port,
			SLOWDOWN_FACTOR_RENDER_TIME,
			urlPath
		);

		const performanceProfile = await collectComponentProfile(
			component,
			page,
			showComponent,
			hideComponent
		);

		debug('render-time', '\tExtracting render time');
		const renderTime =
			(await getProfileRenderTime(
				component.js.componentName,
				performanceProfile
			)) / SLOWDOWN_FACTOR_RENDER_TIME;
		times.set(component.js.componentName, renderTime);

		await page.close();
		await browser.close();

		debug(
			'render-time',
			`\tRender time for ${component.js.componentName} is ${renderTime}ms`
		);
	}

	return times;
}

function joinMeasuredData(maps: Map<string, number>[]): RenderTime {
	const joinedComponentMap: Map<string, number[]> = new Map();

	for (const map of maps) {
		for (const [componentName, measurement] of map.entries()) {
			if (!joinedComponentMap.has(componentName)) {
				joinedComponentMap.set(componentName, []);
			}

			joinedComponentMap.get(componentName)!.push(measurement);
		}
	}

	const renderTimesPerFile: RenderTime['files'] = {};
	for (const [componentName, measurements] of joinedComponentMap) {
		renderTimesPerFile[componentName] = {
			times: measurements,
			stats: getDatasetStats(measurements),
		};
	}

	return {
		files: renderTimesPerFile,
		stats: getDatasetStats(
			Object.values(renderTimesPerFile).flatMap(
				(renderTimes) => renderTimes.times
			)
		),
	};
}

interface RenderTimeSettings {
	components: ComponentFiles[];
	sourceRoot: string;
	urlPath?: string;
	showComponent: (
		component: ComponentFiles,
		page: puppeteer.Page
	) => Promise<void>;
	hideComponent: (
		component: ComponentFiles,
		page: puppeteer.Page
	) => Promise<void>;
}

export async function getRenderTime(
	settings: RenderTimeSettings
): Promise<RenderTime> {
	return await doWithServer(
		getFreePort(),
		settings.sourceRoot,
		async (port) => {
			// Collect runtime info
			const frames: Map<string, number>[] = [];
			for (let i = 0; i < RENDER_TIME_MEASURES; i++) {
				info(
					'render-time',
					`Collecting render times. ${i + 1}/${RENDER_TIME_MEASURES}`
				);
				// Set up a slow browser and page
				frames.push(
					await collectRuntimeRenderTimes({
						...settings,
						port,
					})
				);
			}

			return joinMeasuredData(frames);
		}
	);
}
