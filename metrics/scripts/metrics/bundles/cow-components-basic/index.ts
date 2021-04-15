import * as path from 'path';
import { getBasicCowComponents } from '../../../../collectors/cow-components-basic/dashboard/lib/get-components';
import { BASIC_DASHBOARD_DIR } from '../../../../collectors/shared/constants';
import {
	getBundleInstallCommandCreator,
	getBundleMetricsCommandCreator,
} from '../../../lib/bundles-shared';
import {
	createAngularSetupCommand,
	getAngularDirs,
} from '../../../lib/cow-component-setups/angular/angular';
import { createDashboardMetricsCommand } from '../../../lib/cow-component-setups/dashboard/dashboard';
import { createNativeSetupCommand } from '../../../lib/cow-component-setups/native/native';
import { createReactSetupCommand } from '../../../lib/cow-component-setups/react/react';
import { getCowComponentsDirs } from '../../../lib/cow-component-setups/shared';
import { createSvelteSetupCommand } from '../../../lib/cow-component-setups/svelte/svelte';

import {
	DEMO_REPO_DIR_BASIC,
	getToggleableDir,
} from '../../../lib/cow-components-shared';
import { registerInstallCommand } from '../../../lib/makfy-helper';
import {
	ConstArrItems,
	ParallelBundleMap,
	SerialBundleMap,
} from '../../../lib/types';

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
	'cow-components-basic-angular': registerInstallCommand(
		'cow-components-basic-angular'
	).run(async (exec) => {
		// For Angular we use the regular bundle for size and load-time
		// testing. This is because it will be excluded from the build
		// if not used. And the few bytes added should not make a big
		// difference
		await exec('? Installing dependencies');
		const demoDirCtx = await exec(
			`cd ${
				getCowComponentsDirs(BASIC_DASHBOARD_DIR, 'angular')
					.frameworkDemoDir
			}`
		);
		await demoDirCtx.keepContext('npm install');
	}),
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
	'cow-components-basic-angular': createAngularSetupCommand(
		'cow-components-basic-angular',
		BASIC_DASHBOARD_DIR
	),
	'cow-components-basic-native': createNativeSetupCommand(
		'cow-components-basic-native',
		BASIC_DASHBOARD_DIR
	),
	'cow-components-basic-react': createReactSetupCommand(
		'cow-components-basic-react',
		BASIC_DASHBOARD_DIR
	),
	'cow-components-basic-svelte': createSvelteSetupCommand(
		'cow-components-basic-svelte',
		BASIC_DASHBOARD_DIR
	),
};

// Serial tasks
export const cowComponentsBasicSerialBundleMap: SerialBundleMap<CowComponentBasicBundle> = {
	'basic-dashboard': createDashboardMetricsCommand(
		'basic-dashboard',
		BASIC_DASHBOARD_DIR,
		'cow-components-basic'
	),
	'cow-components-basic-angular': metricsCreator(
		'cow-components-basic-angular',
		{
			demoDir: () =>
				getAngularDirs(BASIC_DASHBOARD_DIR).angularMetadataBundle,
			indexJsFileName: 'bundle.js',
			renderTimeDemoDir: () =>
				path.join(
					getCowComponentsDirs(BASIC_DASHBOARD_DIR, 'angular')
						.frameworkDemoDir,
					'dist/angular-demo'
				),
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
