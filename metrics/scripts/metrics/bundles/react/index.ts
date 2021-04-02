import {
	getBundleMetricsCommandCreator,
	getBundleSetupCommandCreator,
} from '../../../lib/bundles-shared';
import {
	ConstArrItems,
	NamedParallelBundleMap,
	NamedSerialBundleMap,
} from '../../../lib/types';

type ReactBundles = ConstArrItems<typeof reactBundles>;

export const reactBundles = ['material-ui', 'react-bootstrap'] as const;

const setupCreator = getBundleSetupCommandCreator('react');
const metricsCreator = getBundleMetricsCommandCreator('react');

export const reactParallelBundleMap: NamedParallelBundleMap<ReactBundles> = {
	'material-ui': setupCreator('material-ui'),
	'react-bootstrap': setupCreator('react-bootstrap'),
};

export const reactSerialBundleMap: NamedSerialBundleMap<ReactBundles> = {
	'material-ui': metricsCreator('material-ui'),
	'react-bootstrap': metricsCreator('react-bootstrap'),
};
