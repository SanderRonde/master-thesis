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

type ReactBundles = ConstArrItems<typeof reactBundles>;

export const reactBundles = [
	'material-ui',
	'react-bootstrap',
	'semantic-ui-react',
] as const;

const installCreator = getBundleInstallCommandCreator('react');
const setupCreator = getBundleSetupCommandCreator('react');
const metricsCreator = getBundleMetricsCommandCreator('react');

export const reactInstallBundleMap: NamedSerialBundleMap<ReactBundles> = {
	'material-ui': installCreator('material-ui'),
	'react-bootstrap': installCreator('react-bootstrap'),
	'semantic-ui-react': installCreator('semantic-ui-react'),
};


export const reactParallelBundleMap: NamedParallelBundleMap<ReactBundles> = {
	'material-ui': setupCreator('material-ui'),
	'react-bootstrap': setupCreator('react-bootstrap'),
	'semantic-ui-react': setupCreator('semantic-ui-react'),
};

export const reactSerialBundleMap: NamedSerialBundleMap<ReactBundles> = {
	'material-ui': metricsCreator('material-ui'),
	'react-bootstrap': metricsCreator('react-bootstrap'),
	'semantic-ui-react': metricsCreator('semantic-ui-react'),
};
