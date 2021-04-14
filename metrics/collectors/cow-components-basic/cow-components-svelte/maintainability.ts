import { getMaintainabilityMetrics } from '../dashboard/maintainability';
import { runFunctionIfCalledFromScript } from '../../shared/helpers';
import { storeData } from '../../shared/storage';
import { STORE_NAME } from './lib/constants';

runFunctionIfCalledFromScript(async () => {
	await storeData(
		['metrics', 'cow-components-basic', STORE_NAME, 'maintainability'],
		await getMaintainabilityMetrics()
	);
}, __filename);
