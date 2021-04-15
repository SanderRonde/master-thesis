import {
	getBundleInstallCommandCreator,
	getBundleMetricsCommandCreator,
	getBundleSetupCommandCreator,
} from '../../../lib/bundles-shared';
import { LoadTimeMetricConfig } from '../../../lib/time-metrics';
import {
	ConstArrItems,
	NamedParallelBundleMap,
	NamedSerialBundleMap,
	TimeMetricBundleMap,
} from '../../../lib/types';

export type SvelteBundle = ConstArrItems<typeof svelteBundles>;

export const svelteBundles = [
	'svelte-material-ui',
	'smelte',
	'svelte-mui',
] as const;

const installCreator = getBundleInstallCommandCreator('svelte');
const setupCreator = getBundleSetupCommandCreator('svelte');
const metricsCreator = getBundleMetricsCommandCreator('svelte');

export const svelteInstallBundleMap: NamedSerialBundleMap<SvelteBundle> = {
	'svelte-material-ui': installCreator('svelte-material-ui'),
	smelte: installCreator('smelte'),
	'svelte-mui': installCreator('svelte-mui'),
};

export const svelteParallelBundleMap: NamedParallelBundleMap<SvelteBundle> = {
	'svelte-material-ui': setupCreator('svelte-material-ui'),
	smelte: setupCreator('smelte'),
	'svelte-mui': setupCreator('svelte-mui'),
};

export const svelteSerialBundleMap: NamedSerialBundleMap<SvelteBundle> = {
	'svelte-material-ui': metricsCreator('svelte-material-ui'),
	smelte: metricsCreator('smelte'),
	'svelte-mui': metricsCreator('svelte-mui'),
};

const timeMetricsArgs: LoadTimeMetricConfig = {
	bundleCategory: 'svelte',
};
export const svelteTimeMetricsMap: TimeMetricBundleMap<SvelteBundle> = {
	'svelte-material-ui': timeMetricsArgs,
	smelte: timeMetricsArgs,
	'svelte-mui': timeMetricsArgs,
};
