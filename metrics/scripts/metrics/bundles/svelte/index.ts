import { collectBundleMetrics } from '../../../lib/bundles-shared';
import {
	ConstArrItems,
	ParallelBundleMap,
	SerialBundleMap,
} from '../../../lib/types';

type SvelteBundles = ConstArrItems<typeof svelteBundles>;

export const svelteBundles = [
	'svelte-material-ui',
	'smelte',
	'svelte-mui',
] as const;

const {
	metricsCommand: svelteMaterialUIMetrics,
	setupCommand: svelteMaterialUISetup,
} = collectBundleMetrics('svelte', 'svelte-material-ui');
const {
	metricsCommand: smelteMetrics,
	setupCommand: smelteSetup,
} = collectBundleMetrics('svelte', 'smelte');
const {
	metricsCommand: svelteMUIMetrics,
	setupCommand: svelteMUISetup,
} = collectBundleMetrics('svelte', 'svelte-mui');

export const svelteParallelBundleMap: ParallelBundleMap<SvelteBundles> = {
	'svelte-material-ui': svelteMaterialUISetup,
	smelte: smelteSetup,
	'svelte-mui': svelteMUISetup,
};

export const svelteSerialBundleMap: SerialBundleMap<SvelteBundles> = {
	'svelte-material-ui': svelteMaterialUIMetrics,
	smelte: smelteMetrics,
	'svelte-mui': svelteMUIMetrics,
};
