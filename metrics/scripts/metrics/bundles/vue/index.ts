import * as path from 'path';
import {
	getBundleInstallCommandCreator,
	getBundleMetricsCommandCreator,
	getBundleSetupCommandCreator,
} from '../../../lib/bundles-shared';
import {
	ConstArrItems,
	NamedParallelBundleMap,
	NamedSerialBundleMap,
} from '../../../lib/types';

export type VueBundle = ConstArrItems<typeof vueBundles>;

export const vueBundles = ['element', 'vuetify'] as const;

const installCreator = getBundleInstallCommandCreator('vue');
const setupCreator = getBundleSetupCommandCreator('vue');
const metricsCreator = getBundleMetricsCommandCreator('vue', {
	demoDir: (basePath) => path.join(basePath, 'demo', 'dist'),
});

export const vueInstallBundleMap: NamedSerialBundleMap<VueBundle> = {
	element: installCreator('element'),
	vuetify: installCreator('vuetify')
};

export const vueParallelBundleMap: NamedParallelBundleMap<VueBundle> = {
	element: setupCreator('element'),
	vuetify: setupCreator('vuetify')
};

export const vueSerialBundleMap: NamedSerialBundleMap<VueBundle> = {
	element: metricsCreator('element'),
	vuetify: metricsCreator('vuetify')
};
