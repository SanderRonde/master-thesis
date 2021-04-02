import {
	getBundleMetricsCommandCreator,
	getBundleSetupCommandCreator,
} from '../../../lib/bundles-shared';
import {
	ConstArrItems,
	NamedParallelBundleMap,
	NamedSerialBundleMap,
} from '../../../lib/types';

type WebComponentsBundles = ConstArrItems<typeof webComponentsBundles>;

export const webComponentsBundles = ['wired-elements', 'clarity', 'fast'] as const;

const setupCreator = getBundleSetupCommandCreator('web-components');
const metricsCreator = getBundleMetricsCommandCreator('web-components');

export const webcomponentsParallelBundleMap: NamedParallelBundleMap<WebComponentsBundles> = {
	'wired-elements': setupCreator('wired-elements'),
	clarity: setupCreator('clarity'),
	fast: setupCreator('fast'),
};

export const webcomponentsSerialBundleMap: NamedSerialBundleMap<WebComponentsBundles> = {
	'wired-elements': metricsCreator('wired-elements'),
	clarity: metricsCreator('clarity'),
	fast: metricsCreator('fast'),
};
