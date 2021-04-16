import { openPage } from '../../collectors/metric-definitions/render-time';
import { startServer } from '../../collectors/shared/dashboard/serve-dashboard-dist';
import { info } from '../../collectors/shared/log';
import {
	PAGE_LOAD_TIME_PERFORMANCE_MEASURES,
	PAGE_LOAD_TIME_SLOWDOWN_FACTOR,
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

async function measurePageLoadMetrics(
	port: number,
	urlPath: string
): Promise<PageLoadTimeMeasurements> {
	const { page, browser } = await openPage(
		port,
		PAGE_LOAD_TIME_SLOWDOWN_FACTOR,
		urlPath
	);

	const firstPaint = JSON.parse(
		await page.evaluate(() =>
			JSON.stringify(performance.getEntriesByName('first-paint'))
		)
	).startTime;
	const firstContentfulPaint = JSON.parse(
		await page.evaluate(() =>
			JSON.stringify(
				performance.getEntriesByName('first-contentful-paint')
			)
		)
	).startTime;

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
