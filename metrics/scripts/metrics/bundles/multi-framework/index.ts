import * as path from 'path';
import {
	getBundleMetricsCommandCreator,
	getBundleSetupCommandCreator,
} from '../../../lib/bundles-shared';
import {
	ConstArrItems,
	NamedParallelBundleMap,
	NamedSerialBundleMap,
} from '../../../lib/types';

type MultiFrameworkBundles = ConstArrItems<typeof multiFrameworkBundles>;

export const multiFrameworkBundles = [
	'onsen-react',
	'onsen-web-components',
	'onsen-angular',
	'prime-react',
	'prime-ng',
] as const;

const setupCreator = getBundleSetupCommandCreator('multi-framework');
const metricsCreator = getBundleMetricsCommandCreator('multi-framework');

export const multiFrameworkParallelBundleMap: NamedParallelBundleMap<MultiFrameworkBundles> = {
	'onsen-react': setupCreator('onsen-react'),
	'onsen-web-components': setupCreator('onsen-web-components'),
	'onsen-angular': setupCreator('onsen-angular'),
	'prime-react': setupCreator('prime-react'),
	'prime-ng': setupCreator('prime-ng'),
};

export const multiFrameworkSerialBundleMap: NamedSerialBundleMap<MultiFrameworkBundles> = {
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
};
