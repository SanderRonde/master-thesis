import { openPage } from '../../collectors/metric-definitions/render-time';
import { startServer } from '../../collectors/shared/dashboard/serve-dashboard-dist';
import { wait } from '../../collectors/shared/helpers';
import { info } from '../../collectors/shared/log';
import {
	PAGE_LOAD_TIME_MAX_WAIT_TIME,
	PAGE_LOAD_TIME_PERFORMANCE_MEASURES,
	PAGE_LOAD_TIME_SLOWDOWN_FACTOR,
	PAGE_LOAD_TIME_WAIT_TIME_INTERVAL,
} from '../../collectors/shared/settings';
import { getDatasetStats } from '../../collectors/shared/stats';
import { storeData } from '../../collectors/shared/storage';
import { PageLoadTime } from '../../collectors/shared/types';

export interface PageLoadSettings {
	basePath: string;
	urlPath?: string;
	bundleCategory: string;
	bundleName: string;
}

interface PageLoadTimeMeasurements {
	'first-paint': number;
	'first-contentful-paint': number;
}

type PagePerformanceMeasurement = {
	name: string;
	entryType: string;
	startTime: number;
	duration: number;
}[];

async function measurePageLoadMetrics(
	port: number,
	urlPath: string
): Promise<PageLoadTimeMeasurements> {
	const { page, browser } = await openPage(
		port,
		PAGE_LOAD_TIME_SLOWDOWN_FACTOR,
		urlPath
	);

	for (
		let i = 0;
		i < PAGE_LOAD_TIME_MAX_WAIT_TIME / PAGE_LOAD_TIME_WAIT_TIME_INTERVAL;
		i++
	) {
		await wait(PAGE_LOAD_TIME_WAIT_TIME_INTERVAL);
		const firstPaintMeasurements = JSON.parse(
			await page.evaluate(() =>
				JSON.stringify(performance.getEntriesByName('first-paint'))
			)
		) as PagePerformanceMeasurement;
		const firstContentfulPaintMeasurements = JSON.parse(
			await page.evaluate(() =>
				JSON.stringify(
					performance.getEntriesByName('first-contentful-paint')
				)
			)
		) as PagePerformanceMeasurement;
		if (
			firstPaintMeasurements.length &&
			firstContentfulPaintMeasurements.length
		) {
			break;
		}
	}

	const firstPaintMeasurements = JSON.parse(
		await page.evaluate(() =>
			JSON.stringify(performance.getEntriesByName('first-paint'))
		)
	) as PagePerformanceMeasurement;
	const firstContentfulPaintMeasurements = JSON.parse(
		await page.evaluate(() =>
			JSON.stringify(
				performance.getEntriesByName('first-contentful-paint')
			)
		)
	) as PagePerformanceMeasurement;
	if (
		!firstPaintMeasurements.length ||
		!firstContentfulPaintMeasurements.length
	) {
		throw new Error(
			'Failed to read first paint or first contentful paint metric'
		);
	}

	const firstPaint = firstPaintMeasurements[0].startTime;
	const firstContentfulPaint = firstContentfulPaintMeasurements[0].startTime;

	await page.close();
	await browser.close();

	return {
		'first-paint': firstPaint / PAGE_LOAD_TIME_SLOWDOWN_FACTOR,
		'first-contentful-paint':
			firstContentfulPaint / PAGE_LOAD_TIME_SLOWDOWN_FACTOR,
	};
}

async function setupPageLoadTime(
	onDone: (data: PageLoadTime) => Promise<void>,
	settings: PageLoadSettings
): Promise<(() => Promise<void>)[]> {
	const { port, stop } = await startServer(0, settings.basePath);

	const measurements: PageLoadTimeMeasurements[] = [];
	return new Array(PAGE_LOAD_TIME_PERFORMANCE_MEASURES).fill('').map(() => {
		return async () => {
			info(
				'load-time',
				`Creating page load time profile for iteration ${
					measurements.length + 1
				}/${PAGE_LOAD_TIME_PERFORMANCE_MEASURES}`
			);
			measurements.push(
				await measurePageLoadMetrics(
					port,
					settings.urlPath || '/index.html'
				)
			);

			if (measurements.length === PAGE_LOAD_TIME_PERFORMANCE_MEASURES) {
				stop();
				await onDone({
					'first-paint': (() => {
						const values = measurements.map(
							(m) => m['first-paint']
						);
						return {
							times: values,
							stats: getDatasetStats(values),
						};
					})(),
					'first-contentful-paint': (() => {
						const values = measurements.map(
							(m) => m['first-contentful-paint']
						);
						return {
							times: values,
							stats: getDatasetStats(values),
						};
					})(),
				});
			}
		};
	});
}

export function setupPageLoadTimeMeasuring(
	settings: PageLoadSettings
): Promise<(() => Promise<void>)[]> {
	// Assume that the demo has already been built
	return setupPageLoadTime(async (data) => {
		await storeData(
			[
				'metrics',
				settings.bundleCategory,
				settings.bundleName,
				'page-load-time',
			],
			data
		);
	}, settings);
}
