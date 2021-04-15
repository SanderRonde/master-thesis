import { setupLoadTimeMeasuringForDir } from '../../collectors/metric-definitions/load-time';
import { setupRenderTime } from '../../collectors/metric-definitions/render-time';
import { duplicateRenderTimeKeys } from '../../collectors/shared/cow-components-shared';
import { ComponentVisibilitySetterWindow } from '../../collectors/shared/shapes';
import { storeData } from '../../collectors/shared/storage';
import { BundleMetricsOverrides, getSharedBundlePaths } from './bundles-shared';

export type LoadTimeMetricConfig = BundleMetricsOverrides & {
	bundleCategory: string;
};

export type PerBundleLoadTimeMetricConfig = LoadTimeMetricConfig & {
	bundleName: string;
};

declare const window: ComponentVisibilitySetterWindow;

export async function setupLoadTimeMeasuring(
	config: PerBundleLoadTimeMetricConfig
) {
	const { basePath, demoPath } = getSharedBundlePaths(
		config.bundleCategory,
		config.bundleName,
		config
	);

	return setupLoadTimeMeasuringForDir(
		async (data) => {
			await storeData(
				[
					'metrics',
					config.bundleCategory,
					config.bundleName,
					'load-time',
				],
				data
			);
		},
		config.demoDir?.(basePath) || demoPath,
		config.indexJsFileName || 'demo.bundle.js',
		config.urlPath || '/demo.html'
	);
}

export function setupRenderTimeMeasuring(
	config: PerBundleLoadTimeMetricConfig
) {
	const { basePath, demoPath } = getSharedBundlePaths(
		config.bundleCategory,
		config.bundleName,
		config
	);

	return setupRenderTime(
		async (data) => {
			await storeData(
				[
					'metrics',
					config.bundleCategory,
					config.bundleName,
					'render-time',
				],
				duplicateRenderTimeKeys(data)
			);
		},
		{
			getComponents: async (page) => {
				const visibleComponentNames = await page.evaluate(() => {
					return window.availableComponents;
				});
				return visibleComponentNames;
			},
			sourceRoot:
				config.renderTimeDemoDir?.(basePath) ||
				config.demoDir?.(basePath) ||
				demoPath,
			urlPath: config.urlPath || '/demo.html',
			showComponent: async (component, numberOfComponents, page) => {
				await page.evaluate((componentName) => {
					window.setVisibleComponent(componentName, numberOfComponents, true);
				}, component, numberOfComponents);
			},
		}
	);
}
