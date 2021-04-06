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

export type WebComponentsBundle = ConstArrItems<typeof webComponentsBundles>;

export const webComponentsBundles = [
	'wired-elements',
	'clarity',
	'fast',
] as const;

const installCreator = getBundleInstallCommandCreator('web-components');
const setupCreator = getBundleSetupCommandCreator('web-components');
const metricsCreator = getBundleMetricsCommandCreator('web-components');

export const webcomponentsInstallBundleMap: NamedSerialBundleMap<WebComponentsBundle> = {
	'wired-elements': installCreator('wired-elements'),
	clarity: installCreator('clarity'),
	fast: installCreator('fast'),
};

export const webcomponentsParallelBundleMap: NamedParallelBundleMap<WebComponentsBundle> = {
	'wired-elements': setupCreator('wired-elements'),
	clarity: setupCreator('clarity'),
	fast: setupCreator('fast'),
};

export const webcomponentsSerialBundleMap: NamedSerialBundleMap<WebComponentsBundle> = {
	'wired-elements': metricsCreator('wired-elements'),
	clarity: metricsCreator('clarity'),
	fast: metricsCreator('fast'),
};
