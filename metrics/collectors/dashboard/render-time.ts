import puppeteer from 'puppeteer';
import * as path from 'path';
import * as fs from 'fs-extra';
import * as pngJs from 'pngjs';
import pixelmatch from 'pixelmatch';
import { performance } from 'perf_hooks';

import {
	asyncCreatePNG,
	generateTempFileName,
	getFreePort,
	runFunctionIfCalledFromScript,
	wait,
} from '../shared/helpers';
import { storeData } from '../shared/storage';
import { ComponentFiles, getComponents } from './lib/get-components';
import { FileRenderTimeData, RenderTime } from '../shared/types';
import {
	GOLDEN_FRAME_MAX_DIFF_PIXELS,
	INITIAL_RENDER_WAIT_TIME,
	MEASURED_RENDER_WAIT_TIME,
	RENDER_TIME_CROP,
	RENDER_TIME_HEIGHT,
	RENDER_TIME_MEASURES,
	RENDER_TIME_WIDTH,
	SLOWDOWN_FACTOR,
} from '../shared/settings';
import { doWithServer } from './lib/render-time/serve-dashboard-dist';
import { getDatasetStats } from '../shared/stats';
import { debug, info } from '../shared/log';

const OUTPUT_IMAGES = true;

async function openPage(port: number, slowdownFactor: number) {
	const browser = await puppeteer.launch({
		headless: true,
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
): Promise<Map<string, pngJs.PNG>> {
	const componentTargets: Map<string, pngJs.PNG> = new Map();

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
		const img = await asyncCreatePNG(await fs.readFile(filePath));
		componentTargets.set(
			component.js.componentName,
			cropImage(img, img.width, img.height - RENDER_TIME_CROP)
		);
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

function cropImage(image: pngJs.PNG, width: number, height: number): pngJs.PNG {
	const dst = new pngJs.PNG({
		width,
		height,
	});
	image.bitblt(dst, 0, 0, width, height, 0, 0);
	return dst;
}

async function collectRuntimeScreenshots(
	page: puppeteer.Page,
	components: ComponentFiles[]
) {
	const componentFrames: Map<string, ComponentFrames> = new Map();

	for (let i = 0; i < components.length; i++) {
		const component = components[i];

		const frameSet: ComponentFrames = {
			startTime: 0,
			frames: [],
		};

		// Handle incoming frames
		const client = await page.target().createCDPSession();
		client.on('Page.screencastFrame', async (frameObject) => {
			const now = performance.now();

			const image = cropImage(
				await asyncCreatePNG(Buffer.from(frameObject.data, 'base64')),
				RENDER_TIME_WIDTH,
				RENDER_TIME_HEIGHT - RENDER_TIME_CROP
			);
			frameSet.frames.push({
				time: now,
				frame: image,
			});
			if (OUTPUT_IMAGES) {
				await fs.writeFile(
					await generateTempFileName(
						'png',
						`render-time-runtime-${component.js.componentName}-${now}`
					),
					pngJs.PNG.sync.write(image)
				);
			}
			await client.send('Page.screencastFrameAck', {
				sessionId: frameObject.sessionId,
			});
		});

		// Start capturing
		await client.send('Page.startScreencast', {
			format: 'png',
		});

		info(
			__filename,
			`\tCapturing runtime screenshot for ${
				component.js.componentName
			} (${i + 1}/${components.length})`
		);
		// Show current component
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
		frameSet.startTime = performance.now();

		// Wait for a few seconds
		await wait(MEASURED_RENDER_WAIT_TIME);

		// Stop
		await client.send('Page.stopScreencast');

		// Store folder name
		componentFrames.set(component.js.componentName, frameSet);

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

	return componentFrames;
}

async function findGoldenFrameForComponent(
	frameSets: ComponentFrames[],
	targetFrame: pngJs.PNG,
	componentName: string
): Promise<FileRenderTimeData> {
	const times: number[] = [];

	console.log(frameSets);
	// Iterate over all measures
	for (const frameSet of frameSets) {
		// Iterate through frames until we find one that is close enough to match it
		let written = false;
		for (const { frame, time } of frameSet.frames) {
			if (
				frame.width !== targetFrame.width ||
				frame.height !== targetFrame.height
			) {
				throw new Error(
					'Heights of frame and target frame do not match up'
				);
			}

			const diff = OUTPUT_IMAGES
				? new pngJs.PNG({
						width: frame.width,
						height: frame.height,
				  })
				: null;
			const pixelsDiff = pixelmatch(
				frame.data,
				targetFrame.data,
				diff?.data || null,
				targetFrame.width,
				targetFrame.height
			);
			debug(__filename, `Diff pixels: ${pixelsDiff}`);
			if (OUTPUT_IMAGES) {
				await fs.writeFile(
					await generateTempFileName(
						'png',
						`render-time-diff-${componentName}-${time}`
					),
					pngJs.PNG.sync.write(diff!)
				);
			}

			if (pixelsDiff <= GOLDEN_FRAME_MAX_DIFF_PIXELS) {
				debug(
					__filename,
					`Found perfect frame at ${
						time - frameSet.startTime
					} for ${componentName}`
				);
				times.push(time - frameSet.startTime);
				written = true;
				break;
			}
		}

		if (!written) {
			throw new Error(
				`Failed to find perfect frame for ${componentName}`
			);
		}
	}

	return {
		times,
		stats: getDatasetStats(times),
	};
}

async function findGoldenFrameForComponents(
	componentFrameSets: Map<string, ComponentFrames>[],
	targetFrames: Map<string, pngJs.PNG>
): Promise<RenderTime> {
	const renderTimesPerFile: RenderTime['files'] = {};

	const keys = [...componentFrameSets[0].keys()];
	for (let i = 0; i < keys.length; i++) {
		const componentName = keys[i];
		info(
			__filename,
			`Finding golden frame for ${componentName} (${i + 1}/${
				keys.length
			})`
		);

		renderTimesPerFile[componentName] = await findGoldenFrameForComponent(
			componentFrameSets.map(
				(componentFrameSet) => componentFrameSet.get(componentName)!
			),
			targetFrames.get(componentName)!,
			componentName
		);
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
		const targets = await captureTargetScreenshots(fastPage, components);

		// Close page
		await fastPage.close();
		await fastBrowser.close();

		// Set up a slow browser and page
		const { page: slowPage, browser: slowBrowser } = await openPage(
			port,
			SLOWDOWN_FACTOR
		);

		// Collect runtime info
		const frames: Map<string, ComponentFrames>[] = [];
		for (let i = 0; i < RENDER_TIME_MEASURES; i++) {
			info(
				__filename,
				`Collecting frames. ${i + 1}/${RENDER_TIME_MEASURES}`
			);
			frames.push(await collectRuntimeScreenshots(slowPage, components));
		}

		return await findGoldenFrameForComponents(frames, targets);
	});
}

runFunctionIfCalledFromScript(async () => {
	const components = await getComponents();
	await storeData(
		['metrics', 'dashboard', 'render-time'],
		await getRenderTime(components)
	);
}, __filename);
