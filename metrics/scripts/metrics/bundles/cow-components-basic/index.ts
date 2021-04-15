import * as path from 'path';
import { getBundleInstallCommandCreator } from '../../../lib/bundles-shared';

import { DEMO_REPO_DIR_BASIC } from '../../../lib/cow-components-shared';
import {
	ConstArrItems,
	ParallelBundleMap,
	SerialBundleMap,
} from '../../../lib/types';
import {
	cowComponentsAngularInstall,
	cowComponentsAngularMetrics,
	cowComponentsAngularSetup,
} from './cow-components-angular';
import {
	cowComponentsNativeMetrics,
	cowComponentsNativeSetup,
} from './cow-components-native';
import {
	cowComponentsReactMetrics,
	cowComponentsReactSetup,
} from './cow-components-react';
import {
	cowComponentsSvelteMetrics,
	cowComponentsSvelteSetup,
} from './cow-components-svelte';
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
	'cow-components-basic-svelte': cowComponentsSvelteSetup,
};

// Serial tasks
export const cowComponentsBasicSerialBundleMap: SerialBundleMap<CowComponentBasicBundle> = {
	'basic-dashboard': dashboardMetrics,
	'cow-components-basic-angular': cowComponentsAngularMetrics,
	'cow-components-basic-native': cowComponentsNativeMetrics,
	'cow-components-basic-react': cowComponentsReactMetrics,
	'cow-components-basic-svelte': cowComponentsSvelteMetrics,
};
