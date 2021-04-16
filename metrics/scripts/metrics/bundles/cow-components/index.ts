import * as path from 'path';

import {
	DASHBOARD_DIR,
	SUBMODULES_DIR,
} from '../../../../collectors/shared/constants';
import {
	BundleMetricsOverrides,
	getBundleInstallCommandCreator,
	getBundleMetricsCommandCreator,
} from '../../../lib/bundles-shared';
import {
	createAngularSetupCommand,
	getAngularDirs,
} from '../../../lib/cow-component-setups/angular/angular';
import {
	createDashboardMetricsCommand,
	createDashboardStructuralComplexityFunctionCreator,
	getComponents as getCowComponents,
} from '../../../lib/cow-component-setups/dashboard/dashboard';
import { createNativeSetupCommand } from '../../../lib/cow-component-setups/native/native';
import { createReactSetupCommand } from '../../../lib/cow-component-setups/react/react';
import { getCowComponentsDirs } from '../../../lib/cow-component-setups/shared';
import { createSvelteSetupCommand } from '../../../lib/cow-component-setups/svelte/svelte';
import {
	DEMO_REPO_DIR,
	getToggleableDir,
} from '../../../lib/cow-components-shared';
import { registerInstallCommand } from '../../../lib/makfy-helper';
import { LoadTimeMetricConfig } from '../../../lib/time-metrics';
import {
	ConstArrItems,
	PageLoadTimeMetricBundleMap,
	ParallelBundleMap,
	SerialBundleMap,
	TimeMetricBundleMap,
} from '../../../lib/types';

const SUBMODULE_NAME = '30mhz-dashboard';
const __COW_COMPONENTS_WRAPPERS = [
	'angular',
	'react',
	'native',
	'svelte',
] as const;
type CowComponentsWrapper = ConstArrItems<
	typeof __COW_COMPONENTS_WRAPPERS
>;
const COW_COMPONENTS_WRAPPERS = (__COW_COMPONENTS_WRAPPERS as unknown) as CowComponentsWrapper[];

export const COW_COMPONENT_BUNDLES = COW_COMPONENTS_WRAPPERS.map(
	(wrapper) => `cow-components-${wrapper}` as const
);

export type CowComponentBundle = ConstArrItems<typeof cowComponentBundles>;

// Bundles
export const cowComponentBundles = [
	'dashboard',
	...COW_COMPONENT_BUNDLES,
] as const;

const installCreator = getBundleInstallCommandCreator('cow-components');
const baseMetricArgs: BundleMetricsOverrides = {
	getComponents() {
		return getCowComponents(path.join(SUBMODULES_DIR, SUBMODULE_NAME));
	},
	indexJsFileName: 'index.bundle.js',
	urlPath: '/index.html',
	createComplexityFunction: createDashboardStructuralComplexityFunctionCreator(
		DASHBOARD_DIR
	),
};
const metricsCreator = getBundleMetricsCommandCreator(
	'cow-components',
	baseMetricArgs
);

export const cowComponentsInstallBundleMap: Partial<
	SerialBundleMap<CowComponentBundle>
> = {
	'cow-components-angular': registerInstallCommand(
		'cow-components-angular'
	).run(async (exec) => {
		// For Angular we use the regular bundle for size and load-time
		// testing. This is because it will be excluded from the build
		// if not used. And the few bytes added should not make a big
		// difference
		await exec('? Installing dependencies');
		const demoDirCtx = await exec(
			`cd ${
				getCowComponentsDirs(DASHBOARD_DIR, 'angular').frameworkDemoDir
			}`
		);
		await demoDirCtx.keepContext('npm install');
	}),
	'cow-components-native': installCreator('cow-components-native', {
		demoDir: () => path.join(DEMO_REPO_DIR, 'native'),
	}),
	'cow-components-react': installCreator('cow-components-react', {
		demoDir: () => path.join(DEMO_REPO_DIR, 'react'),
	}),
	'cow-components-svelte': installCreator('cow-components-svelte', {
		demoDir: () => path.join(DEMO_REPO_DIR, 'svelte'),
	}),
};

// Parallel tasks
export const cowComponentsParallelBundleMap: ParallelBundleMap<CowComponentBundle> = {
	'cow-components-angular': createAngularSetupCommand(
		'cow-components-angular',
		DASHBOARD_DIR,
		SUBMODULE_NAME
	),
	'cow-components-native': createNativeSetupCommand(
		'cow-components-native',
		DASHBOARD_DIR,
		SUBMODULE_NAME
	),
	'cow-components-react': createReactSetupCommand(
		'cow-components-react',
		DASHBOARD_DIR,
		SUBMODULE_NAME
	),
	'cow-components-svelte': createSvelteSetupCommand(
		'cow-components-svelte',
		DASHBOARD_DIR,
		SUBMODULE_NAME
	),
};

// Serial tasks
export const cowComponentsSerialBundleMap: SerialBundleMap<CowComponentBundle> = {
	dashboard: createDashboardMetricsCommand(
		'dashboard',
		DASHBOARD_DIR,
		'cow-components',
		SUBMODULE_NAME,
		true
	),
	'cow-components-angular': metricsCreator('cow-components-angular', {
		demoDir: () => getAngularDirs(DASHBOARD_DIR).angularMetadataBundle,
		indexJsFileName: 'bundle.js',
		renderTimeDemoDir: () =>
			path.join(
				getCowComponentsDirs(DASHBOARD_DIR, 'angular').frameworkDemoDir,
				'dist/angular-demo'
			),
	}),
	'cow-components-native': metricsCreator('cow-components-native', {
		demoDir: () => getToggleableDir(DASHBOARD_DIR, 'native'),
	}),
	'cow-components-react': metricsCreator('cow-components-react', {
		demoDir: () => getToggleableDir(DASHBOARD_DIR, 'react'),
	}),
	'cow-components-svelte': metricsCreator('cow-components-svelte', {
		demoDir: () => getToggleableDir(DASHBOARD_DIR, 'svelte'),
	}),
};

const timeMetricsArgs: LoadTimeMetricConfig = {
	...baseMetricArgs,
	bundleCategory: 'cow-components',
};
export const cowComponentsTimeMetricsMap: TimeMetricBundleMap<CowComponentBundle> = {
	'cow-components-angular': {
		...timeMetricsArgs,
		demoDir: () => getAngularDirs(DASHBOARD_DIR).angularMetadataBundle,
		indexJsFileName: 'bundle.js',
		renderTimeDemoDir: () =>
			path.join(
				getCowComponentsDirs(DASHBOARD_DIR, 'angular').frameworkDemoDir,
				'dist/angular-demo'
			),
	},
	'cow-components-native': {
		...timeMetricsArgs,
		demoDir: () => getToggleableDir(DASHBOARD_DIR, 'native'),
	},
	'cow-components-react': {
		...timeMetricsArgs,
		demoDir: () => getToggleableDir(DASHBOARD_DIR, 'react'),
	},
	'cow-components-svelte': {
		...timeMetricsArgs,
		demoDir: () => getToggleableDir(DASHBOARD_DIR, 'svelte'),
	},
};

export const cowComponentsPageLoadTimeMap: PageLoadTimeMetricBundleMap<CowComponentBundle> = {
	dashboard: {
		basePath: path.join(DASHBOARD_DIR, 'dist/dashboard'),
		urlPath: '/404',
		bundleCategory: 'cow-components',
		bundleName: 'dashboard',
	},
	'cow-components-angular': {
		basePath: path.join(
			DASHBOARD_DIR,
			'dist/demo-repo/angular/dist/angular-demo'
		),
		bundleCategory: 'cow-components',
		bundleName: 'cow-components-angular',
	},
	'cow-components-native': {
		basePath: path.join(DASHBOARD_DIR, 'dist/demo-repo/native'),
		bundleCategory: 'cow-components',
		bundleName: 'cow-components-native',
	},
	'cow-components-react': {
		basePath: path.join(DASHBOARD_DIR, 'dist/demo-repo/react'),
		bundleCategory: 'cow-components',
		bundleName: 'cow-components-react',
	},
	'cow-components-svelte': {
		basePath: path.join(DASHBOARD_DIR, 'dist/demo-repo/svelte/public'),
		bundleCategory: 'cow-components',
		bundleName: 'cow-components-svelte',
	},
};
