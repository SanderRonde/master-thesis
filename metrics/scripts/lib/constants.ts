import { angularBundles } from '../metrics/bundles/angular';
import { cowComponentBundles } from '../metrics/bundles/cow-components';
import { multiFrameworkBundles } from '../metrics/bundles/multi-framework';
import { reactBundles } from '../metrics/bundles/react';
import { svelteBundles } from '../metrics/bundles/svelte';
import { webComponentsBundles } from '../metrics/bundles/web-components';

const __BUNDLES = [
	...cowComponentBundles,
	...svelteBundles,
	...reactBundles,
	...angularBundles,
	...webComponentsBundles,
	...multiFrameworkBundles,
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

export const BUNDLES = (__BUNDLES as unknown) as Bundle[];

export const METRICS = (__METRICS as unknown) as Metric[];
