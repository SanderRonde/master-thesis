import { angularBundles, AngularBundle } from '../metrics/bundles/angular';
import {
	cowComponentBundles,
	CowComponentBundle,
} from '../metrics/bundles/cow-components';
import {
	cowComponentBasicBundles,
	CowComponentBasicBundle,
} from '../metrics/bundles/cow-components-basic';
import {
	multiFrameworkBundles,
	MultiFrameworkBundle,
} from '../metrics/bundles/multi-framework';
import { reactBundles, ReactBundle } from '../metrics/bundles/react';
import { svelteBundles, SvelteBundle } from '../metrics/bundles/svelte';
import { VueBundle, vueBundles } from '../metrics/bundles/vue';
import {
	webComponentsBundles,
	WebComponentsBundle,
} from '../metrics/bundles/web-components';

const __BUNDLES = [
	...cowComponentBundles,
	...cowComponentBasicBundles,
	...svelteBundles,
	...reactBundles,
	...angularBundles,
	...webComponentsBundles,
	...multiFrameworkBundles,
	...vueBundles,
] as const;
const __METRICS = [
	'structural-complexity',
	'cyclomatic-complexity',
	'lines-of-code',
	'maintainability',
	'load-time',
	'size',
	'number-of-components',
	'render-time',
] as const;
export type Bundle = typeof __BUNDLES[Extract<keyof typeof __BUNDLES, number>];
export type Metric = typeof __METRICS[Extract<keyof typeof __METRICS, number>];
export type Framework =
	| 'cow-components'
	| 'svelte'
	| 'react'
	| 'angular'
	| 'web-components'
	| 'multi-framework'
	| 'vue';
export type BundlesByFramework = {
	'cow-components': CowComponentBundle;
	'cow-components-basic': CowComponentBasicBundle;
	svelte: SvelteBundle;
	react: ReactBundle;
	angular: AngularBundle;
	'web-components': WebComponentsBundle;
	'multi-framework': MultiFrameworkBundle;
	vue: VueBundle;
};

export const BUNDLES = (__BUNDLES as unknown) as Bundle[];

export const METRICS = (__METRICS as unknown) as Metric[];
