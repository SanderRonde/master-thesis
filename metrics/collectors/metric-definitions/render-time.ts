import puppeteer from 'puppeteer';
import * as fs from 'fs-extra';

import { findLastIndex, generateTempFileName, wait } from '../shared/helpers';
import { debug, info, warning } from '../shared/log';

import {
	KEEP_PROFILES,
	MAX_MEASURED_RENDER_WAIT_TIME,
	NAVIGATION_TIMEOUT,
	NUMBER_OF_COMPONENT_SETS,
	RENDER_TIME_HEIGHT,
	RENDER_TIME_MEASURES,
	RENDER_TIME_TRIES,
	RENDER_TIME_WIDTH,
	SLOWDOWN_FACTOR_RENDER_TIME,
	WAIT_AFTER_IDLE_TIME,
} from '../shared/settings';
import { RenderTime } from '../shared/types';
import { DatasetStats, getDatasetStats } from '../shared/stats';
import { PerformanceEvent, PerformanceProfile } from './load-time';
import { assert } from '../shared/testing';
import { readFile } from '../shared/files';
import { MAX_PUPPETEER_BROWSER_LAUNCH_TRIES } from '../shared/constants';
import {
	doWithServer,
	startServer,
} from '../shared/dashboard/serve-dashboard-dist';

interface PuppeteerWindow extends Window {
	requestIdleCallback(
		callback: () => void,
		options?: {
			timeout?: number;
		}
	): void;
}
declare const window: PuppeteerWindow;

async function tryLaunchPuppeteer(
	options: puppeteer.LaunchOptions &
		puppeteer.BrowserLaunchArgumentOptions &
		puppeteer.BrowserConnectOptions & {
			product?: puppeteer.Product;
			extraPrefsFirefox?: Record<string, unknown>;
		},
	attemptsLeft: number = MAX_PUPPETEER_BROWSER_LAUNCH_TRIES
): Promise<puppeteer.Browser> {
	try {
		const browser = await puppeteer.launch({
			timeout: NAVIGATION_TIMEOUT,
		});
		return browser;
	} catch (e) {
		if (attemptsLeft === 0) {
			throw e;
		}
		await wait(5000);
		return await tryLaunchPuppeteer(options, attemptsLeft - 1);
	}
}

export async function createPage() {
	const browser = await tryLaunchPuppeteer({
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
	path: string = '/'
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
	await page.goto(`http://localhost:${port}${path}`);

	// Wait for the page to load
	await wait(2000);

	return { page, browser };
}

async function collectComponentProfile(
	componentName: string,
	page: puppeteer.Page,
	numberOfComponents: number,
	showComponent: (
		componentName: string,
		numberOfComponents: number,
		page: puppeteer.Page
	) => Promise<void>
): Promise<PerformanceProfile> {
	const profilePath = await generateTempFileName('json', componentName);

	// Start profiling
	await page.tracing.start({
		path: profilePath,
	});

	debug('render-time', '\tWaiting for page to load');

	// Wait a little while
	await wait(2000);

	// Show current component
	await showComponent(componentName, numberOfComponents, page);

	debug('render-time', '\tWaiting for component to render');
	/**
	 * Why not await and use an async function here? Because
	 * typescript will compile it and reference the globally
	 * defined `__awaiter` function. This is not globally
	 * defined in the browser scope, and as such will fail.
	 */
	await page.evaluate((maxWaitTime) => {
		return new Promise((resolve) => {
			window.requestIdleCallback(resolve as any, {
				timeout: maxWaitTime,
			});
		});
	}, MAX_MEASURED_RENDER_WAIT_TIME);

	// Wait just a little bit longer
	await wait(WAIT_AFTER_IDLE_TIME);

	// Stop profiling
	await page.tracing.stop();

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
	getComponents,
	showComponent,
	urlPath = '',
	port,
	numberOfComponents,
}: RenderTimeSettings & {
	port: number;
	numberOfComponents: number;
}): Promise<Map<string, number>> {
	const times: Map<string, number> = new Map();

	// Create a page for gathering the components
	const { page: componentPage, browser: componentBrowser } = await openPage(
		port,
		1,
		urlPath
	);
	const components = await getComponents(componentPage);
	await componentPage.close();
	await componentBrowser.close();

	for (let i = 0; i < components.length; i++) {
		const componentName = components[i];
		info(
			'render-time',
			`\tCapturing render times for ${componentName} (${i + 1}/${
				components.length
			})`
		);

		let succeeded: boolean = false;
		for (let j = 0; j < RENDER_TIME_TRIES; j++) {
			try {
				debug('render-time', '\tOpening page');
				const { page, browser } = await openPage(
					port,
					SLOWDOWN_FACTOR_RENDER_TIME,
					urlPath
				);

				const performanceProfile = await collectComponentProfile(
					componentName,
					page,
					numberOfComponents,
					showComponent
				);

				debug('render-time', '\tExtracting render time');
				const renderTime =
					(await getProfileRenderTime(
						componentName,
						performanceProfile
					)) / SLOWDOWN_FACTOR_RENDER_TIME;
				times.set(componentName, renderTime);

				await page.close();
				await browser.close();

				debug(
					'render-time',
					`\tRender time for ${componentName} is ${renderTime}ms`
				);
				succeeded = true;
				break;
			} catch (e) {
				console.log(e);
				warning(
					'render-time',
					`\tFailed to find render time, retrying (${j + 1}/${
						RENDER_TIME_TRIES - 1
					})`
				);
			}
		}

		if (!succeeded) {
			throw new Error(
				`Failed to find render time for component ${componentName}`
			);
		}
	}

	return times;
}

function joinMeasuredData(map: Map<number, Map<string, number>[]>): RenderTime {
	const joinedComponentMap: Map<string, Map<number, number[]>> = new Map();

	for (const [numberOfComponents, maps] of map.entries()) {
		for (const map of maps) {
			for (const [componentName, measurement] of map.entries()) {
				if (!joinedComponentMap.has(componentName)) {
					joinedComponentMap.set(componentName, new Map());
				}
				if (
					!joinedComponentMap
						.get(componentName)!
						.has(numberOfComponents)
				) {
					joinedComponentMap
						.get(componentName)!
						.set(numberOfComponents, []);
				}

				joinedComponentMap
					.get(componentName)!
					.get(numberOfComponents)!
					.push(measurement);
			}
		}
	}

	const renderTimesPerFile: Partial<RenderTime['components']> = {};
	const numberStats: Map<number, number[]> = new Map();
	for (const [componentName, measurementMap] of joinedComponentMap) {
		renderTimesPerFile[componentName] = {};
		for (const [
			numberOfComponents,
			measurements,
		] of measurementMap.entries()) {
			renderTimesPerFile[componentName]![numberOfComponents] = {
				times: measurements,
				stats: getDatasetStats(measurements),
			};
			if (!numberStats.has(numberOfComponents)) {
				numberStats.set(numberOfComponents, []);
			}
			numberStats.get(numberOfComponents)!.push(...measurements);
		}
	}
	const stats: Record<number, DatasetStats> = {};
	for (const [numberOfComponents, allMeasurements] of numberStats.entries()) {
		stats[numberOfComponents] = getDatasetStats(allMeasurements);
	}

	return {
		components: renderTimesPerFile as RenderTime['components'],
		stats,
	};
}

interface RenderTimeSettings {
	getComponents: (page: puppeteer.Page) => Promise<string[]> | string[];
	sourceRoot: string;
	urlPath?: string;
	showComponent: (
		componentName: string,
		numberOfComponents: number,
		page: puppeteer.Page
	) => Promise<void>;
}

export async function setupRenderTime(
	onDone: (data: RenderTime) => Promise<void>,
	settings: RenderTimeSettings
): Promise<(() => Promise<void>)[]> {
	const { port, stop } = await startServer(0, settings.sourceRoot);

	const frames: Map<number, Map<string, number>[]> = new Map();
	return new Array(RENDER_TIME_MEASURES * NUMBER_OF_COMPONENT_SETS.length)
		.fill('')
		.map((_, i) => {
			return async () => {
				// Set up a slow browser and page
				const numberOfComponents =
					NUMBER_OF_COMPONENT_SETS[
						i % NUMBER_OF_COMPONENT_SETS.length
					];
				if (!frames.has(numberOfComponents)) {
					frames.set(numberOfComponents, []);
				}
				frames.get(numberOfComponents)!.push(
					await collectRuntimeRenderTimes({
						...settings,
						port,
						numberOfComponents,
					})
				);

				for (const possibleNumberOfComponents of NUMBER_OF_COMPONENT_SETS) {
					if (
						!frames.has(possibleNumberOfComponents) ||
						frames.get(possibleNumberOfComponents)!.length !==
							RENDER_TIME_MEASURES
					) {
						return;
					}
				}
				await onDone(joinMeasuredData(frames));
				stop();
			};
		});
}

export async function getRenderTime(
	settings: RenderTimeSettings
): Promise<RenderTime> {
	return await doWithServer(0, settings.sourceRoot, async (port) => {
		// Collect runtime info
		const frames: Map<number, Map<string, number>[]> = new Map();
		for (let i = 0; i < NUMBER_OF_COMPONENT_SETS.length; i++) {
			const numberOfComponents = NUMBER_OF_COMPONENT_SETS[i];
			for (let j = 0; j < RENDER_TIME_MEASURES; j++) {
				info(
					'render-time',
					`Collecting render times for ${numberOfComponents} components ${
						i * RENDER_TIME_MEASURES + j + 1
					}/${RENDER_TIME_MEASURES * NUMBER_OF_COMPONENT_SETS.length}`
				);
				// Set up a slow browser and page
				if (!frames.has(numberOfComponents)) {
					frames.set(numberOfComponents, []);
				}
				frames.get(numberOfComponents)!.push(
					await collectRuntimeRenderTimes({
						...settings,
						port,
						numberOfComponents,
					})
				);
			}
		}

		return joinMeasuredData(frames);
	});
}
