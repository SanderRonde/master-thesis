import { collectBundleMetrics } from '../../../lib/bundles-shared';
import {
	ConstArrItems,
	ParallelBundleMap,
	SerialBundleMap,
} from '../../../lib/types';

type SvelteBundles = ConstArrItems<typeof svelteBundles>;

export const svelteBundles = ['svelte-material-ui', 'smelte'] as const;

const {
	metricsCommand: svelteMaterialUIMetrics,
	setupCommand: svelteMaterialUISetup,
} = collectBundleMetrics('svelte', 'svelte-material-ui');
const {
	metricsCommand: smelteMetrics,
	setupCommand: smelteSetup,
} = collectBundleMetrics('svelte', 'smelte');

export const svelteParallelBundleMap: ParallelBundleMap<SvelteBundles> = {
	'svelte-material-ui': svelteMaterialUISetup,
	smelte: smelteSetup,
};

export const svelteSerialBundleMap: SerialBundleMap<SvelteBundles> = {
	'svelte-material-ui': svelteMaterialUIMetrics,
	smelte: smelteMetrics,
};
