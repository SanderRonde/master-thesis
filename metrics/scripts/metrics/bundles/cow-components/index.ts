import * as path from 'path';

import { getComponents as getCowComponents } from '../../../../collectors/cow-components/dashboard/lib/get-components';
import { DASHBOARD_DIR } from '../../../../collectors/shared/constants';
import {
	getBundleInstallCommandCreator,
	getBundleMetricsCommandCreator,
} from '../../../lib/bundles-shared';
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
import { cowComponentsNativeSetup } from './cow-components-native';
import { cowComponentsReactSetup } from './cow-components-react';
import { cowComponentsSvelteSetup } from './cow-components-svelte';
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
	'cow-components-native': cowComponentsNativeSetup,
	'cow-components-react': cowComponentsReactSetup,
	'cow-components-svelte': cowComponentsSvelteSetup,
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
