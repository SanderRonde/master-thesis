import * as path from 'path';
import { getBasicCowComponents } from '../../../../collectors/cow-components-basic/dashboard/lib/get-components';
import { BASIC_DASHBOARD_DIR } from '../../../../collectors/shared/constants';
import {
	getBundleInstallCommandCreator,
	getBundleMetricsCommandCreator,
} from '../../../lib/bundles-shared';
import { createSvelteSetupCommand } from '../../../lib/cow-component-setups/svelte/svelte';

import {
	DEMO_REPO_DIR_BASIC,
	getToggleableDir,
} from '../../../lib/cow-components-shared';
import {
	ConstArrItems,
	ParallelBundleMap,
	SerialBundleMap,
} from '../../../lib/types';
import {
	ANGULAR_DEMO_DIR,
	ANGULAR_METADATA_BUNDLE,
	cowComponentsAngularInstall,
	cowComponentsAngularSetup,
} from './cow-components-angular';
import { cowComponentsNativeSetup } from './cow-components-native';
import { cowComponentsReactSetup } from './cow-components-react';
import { dashboardMetrics } from './dashboard';

const __COW_COMPONENTS_BASIC_WRAPPERS = [
	'angular',
	'react',
	'native',
	'svelte',
] as const;
export type CowComponentsBasicWrapper = ConstArrItems<
	typeof __COW_COMPONENTS_BASIC_WRAPPERS
>;
const COW_COMPONENTS_BASIC_WRAPPERS = (__COW_COMPONENTS_BASIC_WRAPPERS as unknown) as CowComponentsBasicWrapper[];

export const COW_COMPONENT_BASIC_BUNDLES = COW_COMPONENTS_BASIC_WRAPPERS.map(
	(wrapper) => `cow-components-basic-${wrapper}` as const
);

export type CowComponentBasicBundle = ConstArrItems<
	typeof cowComponentBasicBundles
>;

const installCreator = getBundleInstallCommandCreator('cow-components-basic');
const metricsCreator = getBundleMetricsCommandCreator('cow-components-basic', {
	getComponents() {
		return getBasicCowComponents();
	},
	indexJsFileName: 'index.bundle.js',
	urlPath: '/index.html',
});

// Bundles
export const cowComponentBasicBundles = [
	'basic-dashboard',
	...COW_COMPONENT_BASIC_BUNDLES,
] as const;

export const cowComponentsBasicInstallBundleMap: Partial<
	SerialBundleMap<CowComponentBasicBundle>
> = {
	'cow-components-basic-angular': cowComponentsAngularInstall,
	'cow-components-basic-native': installCreator(
		'cow-components-basic-native',
		{
			demoDir: () => path.join(DEMO_REPO_DIR_BASIC, 'native'),
		}
	),
	'cow-components-basic-react': installCreator('cow-components-basic-react', {
		demoDir: () => path.join(DEMO_REPO_DIR_BASIC, 'react'),
	}),
	'cow-components-basic-svelte': installCreator(
		'cow-components-basic-svelte',
		{
			demoDir: () => path.join(DEMO_REPO_DIR_BASIC, 'svelte'),
		}
	),
};

// Parallel tasks
export const cowComponentsBasicParallelBundleMap: ParallelBundleMap<CowComponentBasicBundle> = {
	'cow-components-basic-angular': cowComponentsAngularSetup,
	'cow-components-basic-native': cowComponentsNativeSetup,
	'cow-components-basic-react': cowComponentsReactSetup,
	'cow-components-basic-svelte': createSvelteSetupCommand(
		'cow-components-basic-svelte',
		BASIC_DASHBOARD_DIR
	),
};

// Serial tasks
export const cowComponentsBasicSerialBundleMap: SerialBundleMap<CowComponentBasicBundle> = {
	'basic-dashboard': dashboardMetrics,
	'cow-components-basic-angular': metricsCreator(
		'cow-components-basic-angular',
		{
			demoDir: () => ANGULAR_METADATA_BUNDLE,
			indexJsFileName: 'bundle.js',
			renderTimeDemoDir: () =>
				path.join(ANGULAR_DEMO_DIR, 'dist/angular-demo'),
		}
	),
	'cow-components-basic-native': metricsCreator(
		'cow-components-basic-native',
		{
			demoDir: () => getToggleableDir(BASIC_DASHBOARD_DIR, 'native'),
		}
	),
	'cow-components-basic-react': metricsCreator('cow-components-basic-react', {
		demoDir: () => getToggleableDir(BASIC_DASHBOARD_DIR, 'react'),
	}),
	'cow-components-basic-svelte': metricsCreator(
		'cow-components-basic-svelte',
		{
			demoDir: () => getToggleableDir(BASIC_DASHBOARD_DIR, 'svelte'),
		}
	),
};
