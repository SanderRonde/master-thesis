import puppeteer from 'puppeteer';
import * as fs from 'fs-extra';
import * as pngJs from 'pngjs';
import { performance } from 'perf_hooks';

import {
	asyncCreatePNG,
	generateTempFileName,
	getFreePort,
	resizeImage,
	runFunctionIfCalledFromScript,
	wait,
} from '../shared/helpers';
import { storeData } from '../shared/storage';
import { ComponentFiles, getComponents } from './lib/get-components';
import { RenderTime } from '../shared/types';
import {
	DEVELOPMENT,
	INITIAL_RENDER_WAIT_TIME,
	MAX_MEASURED_RENDER_WAIT_TIME,
	OUTPUT_IMAGES,
	RENDER_TIME_CROP,
	RENDER_TIME_HEIGHT,
	RENDER_TIME_MEASURES,
	RENDER_TIME_WIDTH,
	SLOWDOWN_FACTOR,
} from '../shared/settings';
import { doWithServer } from './lib/render-time/serve-dashboard-dist';
import { getDatasetStats } from '../shared/stats';
import { debug, info } from '../shared/log';
import { useCache } from '../shared/cache';
import { ImageCompareWorkersClass } from './lib/render-time/lib/image-compare-worker-class';

async function openPage(port: number, slowdownFactor: number) {
	const browser = await puppeteer.launch({
		headless: process.argv.includes('--headful') ? false : true,
	});
	const page = await browser.newPage();
	await page.setViewport({
		width: RENDER_TIME_WIDTH,
		height: RENDER_TIME_HEIGHT,
	});
	const client = await page.target().createCDPSession();
	await client.send('Emulation.setCPUThrottlingRate', {
		rate: slowdownFactor,
	});
	await page.goto(`http://localhost:${port}/404`);

	return { page, browser };
}

interface NGElement {
	__ngContext__: any[];
}

type ComponentFrames = {
	startTime: number;
	frames: {
		frame: pngJs.PNG;
		time: number;
	}[];
};

async function captureTargetScreenshots(
	page: puppeteer.Page,
	components: ComponentFiles[]
): Promise<Map<string, string>> {
	const componentTargets: Map<string, string> = new Map();

	for (let i = 0; i < components.length; i++) {
		const component = components[i];

		// Show current component
		info(
			__filename,
			`Capturing target screenshot for ${component.js.componentName} (${
				i + 1
			}/${components.length})`
		);
		await page.$eval(
			'page-not-found',
			(element, componentName) => {
				((element as unknown) as NGElement).__ngContext__
					.find(
						(c) =>
							c && typeof c === 'object' && 'setRenderOption' in c
					)
					.setRenderOption(componentName, true);
			},
			component.js.componentName
		);

		// Wait for a few seconds
		await wait(INITIAL_RENDER_WAIT_TIME);

		const filePath = await generateTempFileName(
			'png',
			`render-time-target-${component.js.componentName}`
		);
		// Take a screenshot
		await page.screenshot({
			omitBackground: false,
			type: 'png',
			path: filePath,
		});
		const img = await fs.readFile(filePath, 'base64');
		componentTargets.set(component.js.componentName, img);
		if (!OUTPUT_IMAGES) {
			await fs.unlink(filePath);
		}

		// Reset it
		await page.$eval(
			'page-not-found',
			(element, componentName) => {
				((element as unknown) as NGElement).__ngContext__
					.find(
						(c) =>
							c && typeof c === 'object' && 'setRenderOption' in c
					)
					.setRenderOption(componentName, false);
			},
			component.js.componentName
		);

		// Wait a short while
		await wait(500);
	}

	return componentTargets;
}

async function collectRuntimeScreenshots(
	page: puppeteer.Page,
	components: ComponentFiles[],
	targets: Map<string, string>
): Promise<Map<string, number>> {
	const times: Map<string, number> = new Map();

	for (let i = 0; i < components.length; i++) {
		const component = components[i];
		const componentName = component.js.componentName;
		const targetImage = resizeImage(
			await asyncCreatePNG(
				Buffer.from(targets.get(component.js.componentName)!, 'base64')
			),
			{
				height: RENDER_TIME_HEIGHT - RENDER_TIME_CROP,
				width: RENDER_TIME_WIDTH,
				startY: RENDER_TIME_CROP,
			}
		);

		info(
			__filename,
			`\tCapturing runtime screenshot for ${
				component.js.componentName
			} (${i + 1}/${components.length})`
		);

		const client = await page.target().createCDPSession();
		const fileWorker = await new ImageCompareWorkersClass().init(
			targetImage
		);

		await Promise.race([
			new Promise<void>(async (resolve) => {
				let startTime = 0;

				// Handle incoming frames
				client.on('Page.screencastFrame', async (frameObject) => {
					await client.send('Page.screencastFrameAck', {
						sessionId: frameObject.sessionId,
					});

					const now = performance.now();
					fileWorker.pushToQueue(
						componentName,
						frameObject.data,
						now - startTime
					);
				});

				// Start capturing
				await client.send('Page.startScreencast', {
					format: 'png',
				});

				// Show current component
				await page.$eval(
					'page-not-found',
					(element, componentName) => {
						((element as unknown) as NGElement).__ngContext__
							.find(
								(c) =>
									c &&
									typeof c === 'object' &&
									'setRenderOption' in c
							)
							.setRenderOption(componentName, true);
					},
					componentName
				);
				startTime = performance.now();

				fileWorker.onStopInput().then(async () => {
					await client.send('Page.stopScreencast');
				});

				const result = await fileWorker.onResult();
				times.set(componentName, result);

				// Debugging
				debug(
					__filename,
					`\tFound perfect frame at ${result} for ${componentName}`
				);
				resolve();
			}),
			wait(MAX_MEASURED_RENDER_WAIT_TIME),
		]);

		await fileWorker.stop();

		if (!times.has(componentName)) {
			throw new Error(
				`Failed to find matching image for ${componentName} in ${MAX_MEASURED_RENDER_WAIT_TIME}ms`
			);
		}

		// Stop
		await client.send('Page.stopScreencast');

		// Reset it
		await page.$eval(
			'page-not-found',
			(element, componentName) => {
				((element as unknown) as NGElement).__ngContext__
					.find(
						(c) =>
							c && typeof c === 'object' && 'setRenderOption' in c
					)
					.setRenderOption(componentName, false);
			},
			component.js.componentName
		);

		// Wait a short while
		await wait(500);
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

export async function getRenderTime(
	components: ComponentFiles[]
): Promise<RenderTime> {
	return await doWithServer(getFreePort(), async (port) => {
		// Set up a fast browser and page
		const { page: fastPage, browser: fastBrowser } = await openPage(
			port,
			1
		);

		// Get a screenshot for what everything should look like
		const targets = await useCache(
			'dashboard-render-time-golden-screenshots',
			async () => await captureTargetScreenshots(fastPage, components),
			process.argv.includes('--no-cache')
		);

		// Close page
		await fastPage.close();
		await fastBrowser.close();

		// Set up a slow browser and page
		const { page: slowPage } = await openPage(port, SLOWDOWN_FACTOR);

		// Collect runtime info
		const frames: Map<string, number>[] = [];
		for (let i = 0; i < RENDER_TIME_MEASURES; i++) {
			info(
				__filename,
				`Collecting frames. ${i + 1}/${RENDER_TIME_MEASURES}`
			);
			frames.push(
				await collectRuntimeScreenshots(slowPage, components, targets)
			);
		}

		return joinMeasuredData(frames);
	});
}

runFunctionIfCalledFromScript(async () => {
	const components = await getComponents();
	await storeData(
		['metrics', 'dashboard', 'render-time'],
		await getRenderTime(components)
	);
	process.exit(0);
}, __filename);
