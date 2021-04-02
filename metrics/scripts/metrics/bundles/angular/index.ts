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

type AngularBundles = ConstArrItems<typeof angularBundles>;

export const angularBundles = ['angular-material'] as const;

const setupCreator = getBundleSetupCommandCreator('angular');
const metricsCreator = getBundleMetricsCommandCreator('angular', {
	demoDir: (basePath) => path.join(basePath, 'demo/dist/demo'),
	indexJsFileName: 'index.bundle.js',
	urlPath: '/index.html',
});

export const angularParallelBundleMap: NamedParallelBundleMap<AngularBundles> = {
	'angular-material': setupCreator('angular-material'),
};

export const angularSerialBundleMap: NamedSerialBundleMap<AngularBundles> = {
	'angular-material': metricsCreator('angular-material'),
};
