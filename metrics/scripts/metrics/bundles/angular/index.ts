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

export type AngularBundle = ConstArrItems<typeof angularBundles>;

export const angularBundles = [
	'angular-material',
	'ng-bootstrap',
	'ngx-bootstrap',
] as const;

const installCreator = getBundleInstallCommandCreator('angular');
const setupCreator = getBundleSetupCommandCreator('angular');
const metricsArgs: BundleMetricsOverrides = {
	demoDir: (basePath) => path.join(basePath, 'demo/dist/demo'),
	indexJsFileName: 'index.bundle.js',
	urlPath: '/index.html',
};
const metricsCreator = getBundleMetricsCommandCreator('angular', metricsArgs);

export const angularInstallBundleMap: NamedSerialBundleMap<AngularBundle> = {
	'angular-material': installCreator('angular-material'),
	'ngx-bootstrap': installCreator('ngx-bootstrap'),
	'ng-bootstrap': installCreator('ng-bootstrap'),
};

export const angularParallelBundleMap: NamedParallelBundleMap<AngularBundle> = {
	'angular-material': setupCreator('angular-material'),
	'ngx-bootstrap': setupCreator('ngx-bootstrap'),
	'ng-bootstrap': setupCreator('ng-bootstrap'),
};

export const angularSerialBundleMap: NamedSerialBundleMap<AngularBundle> = {
	'angular-material': metricsCreator('angular-material'),
	'ngx-bootstrap': metricsCreator('ngx-bootstrap', {
		isCSSFramework: true,
	}),
	'ng-bootstrap': metricsCreator('ng-bootstrap', {
		isCSSFramework: true,
	}),
};

const timeMetricsArgs: LoadTimeMetricConfig = {
	...metricsArgs,
	bundleCategory: 'angular',
};
export const angularTimeMetricsMap: TimeMetricBundleMap<AngularBundle> = {
	'angular-material': timeMetricsArgs,
	'ngx-bootstrap': timeMetricsArgs,
	'ng-bootstrap': timeMetricsArgs,
};
