import * as path from 'path';

import { getComponents as getCowComponents } from '../../../../collectors/cow-components/dashboard/lib/get-components';
import { DASHBOARD_DIR } from '../../../../collectors/shared/constants';
import {
	getBundleInstallCommandCreator,
	getBundleMetricsCommandCreator,
} from '../../../lib/bundles-shared';
import { createNativeSetupCommand } from '../../../lib/cow-component-setups/native/native';
import { createReactSetupCommand } from '../../../lib/cow-component-setups/react/react';
import { createSvelteSetupCommand } from '../../../lib/cow-component-setups/svelte/svelte';
import {
	DEMO_REPO_DIR,
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

const installCreator = getBundleInstallCommandCreator('cow-components');
const metricsCreator = getBundleMetricsCommandCreator('cow-components', {
	getComponents() {
		return getCowComponents();
	},
	indexJsFileName: 'index.bundle.js',
	urlPath: '/index.html',
});

export const cowComponentsInstallBundleMap: Partial<
	SerialBundleMap<CowComponentBundle>
> = {
	'cow-components-angular': cowComponentsAngularInstall,
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
	'cow-components-angular': cowComponentsAngularSetup,
	'cow-components-native': createNativeSetupCommand(
		'cow-components-native',
		DASHBOARD_DIR
	),
	'cow-components-react': createReactSetupCommand(
		'cow-components-react',
		DASHBOARD_DIR
	),
	'cow-components-svelte': createSvelteSetupCommand(
		'cow-components-svelte',
		DASHBOARD_DIR
	),
};

// Serial tasks
export const cowComponentsSerialBundleMap: SerialBundleMap<CowComponentBundle> = {
	dashboard: dashboardMetrics,
	'cow-components-angular': metricsCreator('cow-components-angular', {
		demoDir: () => ANGULAR_METADATA_BUNDLE,
		indexJsFileName: 'bundle.js',
		renderTimeDemoDir: () =>
			path.join(ANGULAR_DEMO_DIR, 'dist/angular-demo'),
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
