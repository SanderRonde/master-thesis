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
	cowComponentsNativeInstall,
	cowComponentsNativeMetrics,
	cowComponentsNativeSetup,
} from './cow-components-native';
import {
	cowComponentsReactInstall,
	cowComponentsReactMetrics,
	cowComponentsReactSetup,
} from './cow-components-react';
import {
	cowComponentsSvelteInstall,
	cowComponentsSvelteMetrics,
	cowComponentsSvelteSetup,
} from './cow-components-svelte';
import { dashboardMetrics } from './dashboard';

const __COW_COMPONENTS_WRAPPERS = [
	'angular',
	'react',
	'native',
	'svelte',
] as const;
export type CowComponentsWrapper = ConstArrItems<
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

export const cowComponentsInstallBundleMap: Partial<
	SerialBundleMap<CowComponentBundle>
> = {
	'cow-components-angular': cowComponentsAngularInstall,
	'cow-components-native': cowComponentsNativeInstall,
	'cow-components-react': cowComponentsReactInstall,
	'cow-components-svelte': cowComponentsSvelteInstall,
};

// Parallel tasks
export const cowComponentsParallelBundleMap: ParallelBundleMap<CowComponentBundle> = {
	'cow-components-angular': cowComponentsAngularSetup,
	'cow-components-native': cowComponentsNativeSetup,
	'cow-components-react': cowComponentsReactSetup,
	'cow-components-svelte': cowComponentsSvelteSetup,
};

// Serial tasks
export const cowComponentsSerialBundleMap: SerialBundleMap<CowComponentBundle> = {
	dashboard: dashboardMetrics,
	'cow-components-angular': cowComponentsAngularMetrics,
	'cow-components-native': cowComponentsNativeMetrics,
	'cow-components-react': cowComponentsReactMetrics,
	'cow-components-svelte': cowComponentsSvelteMetrics,
};
