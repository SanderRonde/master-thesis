import { collectBundleMetrics } from '../../../lib/bundles-shared';
import {
	ConstArrItems,
	ParallelBundleMap,
	SerialBundleMap,
} from '../../../lib/types';

type SvelteBundles = ConstArrItems<typeof svelteBundles>;

export const svelteBundles = ['svelte-material-ui'] as const;

const {
	metricsCommand: svelteMaterialUIMetrics,
	setupCommand: svelteMaterialUISetup,
} = collectBundleMetrics('svelte', 'svelte-material-ui');

export const svelteParallelBundleMap: ParallelBundleMap<SvelteBundles> = {
	'svelte-material-ui': svelteMaterialUISetup,
};

export const svelteSerialBundleMap: SerialBundleMap<SvelteBundles> = {
	'svelte-material-ui': svelteMaterialUIMetrics,
};
