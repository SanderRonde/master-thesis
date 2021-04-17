import * as path from 'path';
import {
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

export type MultiFrameworkBundle = ConstArrItems<typeof multiFrameworkBundles>;

export const multiFrameworkBundles = [
	'onsen-react',
	'onsen-web-components',
	'onsen-angular',
	'prime-react',
	'prime-ng',
	'prime-vue',
] as const;

const installCreator = getBundleInstallCommandCreator('multi-framework');
const setupCreator = getBundleSetupCommandCreator('multi-framework');
const metricsCreator = getBundleMetricsCommandCreator('multi-framework');

export const multiFrameworkInstallBundleMap: NamedSerialBundleMap<MultiFrameworkBundle> = {
	'onsen-react': installCreator('onsen-react'),
	'onsen-web-components': installCreator('onsen-web-components'),
	'onsen-angular': installCreator('onsen-angular'),
	'prime-react': installCreator('prime-react'),
	'prime-ng': installCreator('prime-ng'),
	'prime-vue': installCreator('prime-vue'),
};

export const multiFrameworkParallelBundleMap: NamedParallelBundleMap<MultiFrameworkBundle> = {
	'onsen-react': setupCreator('onsen-react'),
	'onsen-web-components': setupCreator('onsen-web-components'),
	'onsen-angular': setupCreator('onsen-angular'),
	'prime-react': setupCreator('prime-react'),
	'prime-ng': setupCreator('prime-ng'),
	'prime-vue': setupCreator('prime-vue'),
};

export const multiFrameworkSerialBundleMap: NamedSerialBundleMap<MultiFrameworkBundle> = {
	'onsen-react': metricsCreator('onsen-react', {
		submoduleName: 'onsen',
	}),
	'onsen-web-components': metricsCreator('onsen-web-components', {
		submoduleName: 'onsen',
	}),
	'onsen-angular': metricsCreator('onsen-angular', {
		submoduleName: 'onsen',
		demoDir: (basePath) => path.join(basePath, 'demo/dist/demo'),
		indexJsFileName: 'index.bundle.js',
		urlPath: '/index.html',
	}),
	'prime-react': metricsCreator('prime-react'),
	'prime-ng': metricsCreator('prime-ng', {
		demoDir: (basePath) => path.join(basePath, 'demo/dist/demo'),
		indexJsFileName: 'index.bundle.js',
		urlPath: '/index.html',
	}),
	'prime-vue': metricsCreator('prime-vue', {
		demoDir: (basePath) => path.join(basePath, 'demo', 'dist'),
	}),
};

const timeMetricsArgs: LoadTimeMetricConfig = {
	bundleCategory: 'multi-framework',
};
export const multiFrameworkTimeMetricsMap: TimeMetricBundleMap<MultiFrameworkBundle> = {
	'onsen-react': {
		...timeMetricsArgs,
		submoduleName: 'onsen',
	},
	'onsen-web-components': {
		...timeMetricsArgs,
		submoduleName: 'onsen',
	},
	'onsen-angular': {
		...timeMetricsArgs,
		submoduleName: 'onsen',
		demoDir: (basePath) => path.join(basePath, 'demo/dist/demo'),
		indexJsFileName: 'index.bundle.js',
		urlPath: '/index.html',
	},
	'prime-react': timeMetricsArgs,
	'prime-ng': {
		...timeMetricsArgs,
		demoDir: (basePath) => path.join(basePath, 'demo/dist/demo'),
		indexJsFileName: 'index.bundle.js',
		urlPath: '/index.html',
	},
	'prime-vue': {
		...timeMetricsArgs,
		demoDir: (basePath) => path.join(basePath, 'demo', 'dist'),
		urlPath: '/index.html',
	},
};
