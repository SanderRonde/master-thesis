import {
	getBundleMetricsCommandCreator,
	getBundleSetupCommandCreator,
} from '../../../lib/bundles-shared';
import {
	ConstArrItems,
	NamedParallelBundleMap,
	NamedSerialBundleMap,
} from '../../../lib/types';

type MultiFrameworkBundles = ConstArrItems<typeof multiFrameworkBundles>;

export const multiFrameworkBundles = [
	'onsen-react',
	'onsen-web-components',
	'onsen-angular',
] as const;

const setupCreator = getBundleSetupCommandCreator('multi-framework');
const metricsCreator = getBundleMetricsCommandCreator('multi-framework');

export const multiFrameworkParallelBundleMap: NamedParallelBundleMap<MultiFrameworkBundles> = {
	'onsen-react': setupCreator('onsen-react'),
	'onsen-web-components': setupCreator('onsen-web-components'),
	'onsen-angular': setupCreator('onsen-angular'),
};

export const multiFrameworkSerialBundleMap: NamedSerialBundleMap<MultiFrameworkBundles> = {
	'onsen-react': metricsCreator('onsen-react', {
		submoduleName: 'onsen',
	}),
	'onsen-web-components': metricsCreator('onsen-web-components', {
		submoduleName: 'onsen',
	}),
	'onsen-angular': metricsCreator('onsen-angular', {
		submoduleName: 'onsen',
	}),
};
