import puppeteer from 'puppeteer';
import * as fs from 'fs-extra';
import * as pngJs from 'pngjs';
import * as pixelmatch from 'pixelmatch';
import MassScreenshots from 'puppeteer-mass-screenshots';

import {
	generateTempFileName,
	generateTempFolder,
	getFreePort,
	runFunctionIfCalledFromScript,
	wait,
} from '../shared/helpers';
import { storeData } from '../shared/storage';
import { ComponentFiles, getComponents } from './lib/get-components';
import { RenderTime } from '../shared/types';
import {
	INITIAL_RENDER_WAIT_TIME,
	MEASURED_RENDER_WAIT_TIME,
	SLOWDOWN_FACTOR,
} from '../shared/settings';
import { doWithServer } from './lib/render-time/serve-dashboard-dist';

async function openPage(port: number, slowdownFactor: number) {
	const browser = await puppeteer.launch();
	const page = await browser.newPage();
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

async function captureTargetScreenshots(
	page: puppeteer.Page,
	components: ComponentFiles[]
) {
	const componentTargets: {
		[key: string]: pngJs.PNGWithMetadata;
	} = {};

	for (const component of components) {
		// Show current component
		console.log(
			`Capturing target screenshot for ${component.js.componentName}`
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

		const filePath = await generateTempFileName('png');
		// Take a screenshot
		await page.screenshot({
			fullPage: true,
			omitBackground: false,
			type: 'png',
			path: filePath,
		});
		componentTargets[component.js.componentName] = pngJs.PNG.sync.read(
			await fs.readFile(filePath)
		);

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
	components: ComponentFiles[]
) {
	const componentFolders: {
		[key: string]: string;
	} = {};

	for (const component of components) {
		const screenshots = new MassScreenshots();
		const folderName = await generateTempFolder();
		await screenshots.init(page, folderName);

		// Prep by painting the background red for distinction
		await page.$eval(
			'body',
			(element) => {
				(element as HTMLElement).style.backgroundColor = 'red';
			},
			component.js.componentName
		);

		// Start capturing
		await screenshots.start();

		console.log(
			`Capturing runtime screenshot for ${component.js.componentName}`
		);
		// Show current component
		await page.$eval(
			'page-not-found',
			(element, componentName) => {
				document.body.style.backgroundColor = 'white';
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
		await wait(MEASURED_RENDER_WAIT_TIME);

		// Stop
		await screenshots.stop();

		// Store folder name
		componentFolders[component.js.componentName] = folderName;

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

	return componentFolders;
}

export async function getRenderTime(
	components: ComponentFiles[]
): Promise<RenderTime> {
	await doWithServer(getFreePort(), async (port) => {
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
		const folders = await collectRuntimeScreenshots(slowPage, components);

		// TODO: measure differences
	});
}

runFunctionIfCalledFromScript(async () => {
	const components = await getComponents();
	await storeData(
		['metrics', 'dashboard', 'render-time'],
		await getRenderTime(components)
	);
}, __filename);
