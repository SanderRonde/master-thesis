import {
	getBundleInstallCommandCreator,
	getBundleMetricsCommandCreator,
	getBundleSetupCommandCreator,
} from '../../../lib/bundles-shared';
import {
	ConstArrItems,
	NamedParallelBundleMap,
	NamedSerialBundleMap,
} from '../../../lib/types';

type SvelteBundles = ConstArrItems<typeof svelteBundles>;

export const svelteBundles = [
	'svelte-material-ui',
	'smelte',
	'svelte-mui',
] as const;

const installCreator = getBundleInstallCommandCreator('svelte');
const setupCreator = getBundleSetupCommandCreator('svelte');
const metricsCreator = getBundleMetricsCommandCreator('svelte');

export const svelteInstallBundleMap: NamedSerialBundleMap<SvelteBundles> = {
	'svelte-material-ui': installCreator('svelte-material-ui'),
	smelte: installCreator('smelte'),
	'svelte-mui': installCreator('svelte-mui'),
};

export const svelteParallelBundleMap: NamedParallelBundleMap<SvelteBundles> = {
	'svelte-material-ui': setupCreator('svelte-material-ui'),
	smelte: setupCreator('smelte'),
	'svelte-mui': setupCreator('svelte-mui'),
};

export const svelteSerialBundleMap: NamedSerialBundleMap<SvelteBundles> = {
	'svelte-material-ui': metricsCreator('svelte-material-ui'),
	smelte: metricsCreator('smelte'),
	'svelte-mui': metricsCreator('svelte-mui'),
};
