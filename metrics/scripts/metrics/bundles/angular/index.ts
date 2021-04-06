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

export type AngularBundle = ConstArrItems<typeof angularBundles>;

export const angularBundles = [
	'angular-material',
	'ng-bootstrap',
	'ngx-bootstrap',
] as const;

const installCreator = getBundleInstallCommandCreator('angular');
const setupCreator = getBundleSetupCommandCreator('angular');
const metricsCreator = getBundleMetricsCommandCreator('angular', {
	demoDir: (basePath) => path.join(basePath, 'demo/dist/demo'),
	indexJsFileName: 'index.bundle.js',
	urlPath: '/index.html',
});

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
