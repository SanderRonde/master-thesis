import * as path from 'path';

import { DASHBOARD_DIR, SUBMODULES_DIR } from '../../../../collectors/shared/constants';
import {
	getBundleInstallCommandCreator,
	getBundleMetricsCommandCreator,
} from '../../../lib/bundles-shared';
import {
	createAngularSetupCommand,
	getAngularDirs,
} from '../../../lib/cow-component-setups/angular/angular';
import { createDashboardMetricsCommand, getComponents as getCowComponents } from '../../../lib/cow-component-setups/dashboard/dashboard';
import { createNativeSetupCommand } from '../../../lib/cow-component-setups/native/native';
import { createReactSetupCommand } from '../../../lib/cow-component-setups/react/react';
import { getCowComponentsDirs } from '../../../lib/cow-component-setups/shared';
import { createSvelteSetupCommand } from '../../../lib/cow-component-setups/svelte/svelte';
import {
	DEMO_REPO_DIR,
	getToggleableDir,
} from '../../../lib/cow-components-shared';
import { registerInstallCommand } from '../../../lib/makfy-helper';
import {
	ConstArrItems,
	ParallelBundleMap,
	SerialBundleMap,
} from '../../../lib/types';

const SUBMODULE_NAME = '30mhz-dashboard';
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
		return getCowComponents(path.join(SUBMODULES_DIR, SUBMODULE_NAME));
	},
	indexJsFileName: 'index.bundle.js',
	urlPath: '/index.html',
});

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
		DASHBOARD_DIR
	),
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
	dashboard: createDashboardMetricsCommand(
		'dashboard',
		DASHBOARD_DIR,
		'cow-components',
		SUBMODULE_NAME
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
