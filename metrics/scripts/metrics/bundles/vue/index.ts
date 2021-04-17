import * as path from 'path';
import {
	BundleMetricsOverrides,
	getBundleInstallCommandCreator,
	getBundleMetricsCommandCreator,
	getBundleSetupCommandCreator,
} from '../../../lib/bundles-shared';
import { LoadTimeMetricConfig } from '../../../lib/time-metrics';
import {
	ConstArrItems,
	NamedParallelBundleMap,
	NamedSerialBundleMap,
	TimeMetricBundleMap,
} from '../../../lib/types';

export type VueBundle = ConstArrItems<typeof vueBundles>;

export const vueBundles = ['element', 'vuetify', 'quasar'] as const;

const installCreator = getBundleInstallCommandCreator('vue');
const setupCreator = getBundleSetupCommandCreator('vue');
const baseMetricOverrides: BundleMetricsOverrides = {
	demoDir: (basePath) => path.join(basePath, 'demo', 'dist'),
	urlPath: '/index.html',
};
const metricsCreator = getBundleMetricsCommandCreator(
	'vue',
	baseMetricOverrides
);

export const vueInstallBundleMap: NamedSerialBundleMap<VueBundle> = {
	element: installCreator('element'),
	vuetify: installCreator('vuetify'),
	quasar: installCreator('quasar'),
};

export const vueParallelBundleMap: NamedParallelBundleMap<VueBundle> = {
	element: setupCreator('element'),
	vuetify: setupCreator('vuetify'),
	quasar: setupCreator('quasar'),
};

export const vueSerialBundleMap: NamedSerialBundleMap<VueBundle> = {
	element: metricsCreator('element'),
	vuetify: metricsCreator('vuetify'),
	quasar: metricsCreator('quasar'),
};

const timeMetricsArgs: LoadTimeMetricConfig = {
	...baseMetricOverrides,
	bundleCategory: 'vue',
};
export const vueTimeMetricsMap: TimeMetricBundleMap<VueBundle> = {
	element: timeMetricsArgs,
	vuetify: timeMetricsArgs,
	quasar: timeMetricsArgs,
};
