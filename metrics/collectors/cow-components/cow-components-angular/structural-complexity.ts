import { getStructuralComplexityMetrics } from '../dashboard/structural-complexity';
import { runFunctionIfCalledFromScript } from '../../shared/helpers';
import { storeData } from '../../shared/storage';
import { STORE_NAME } from './lib/constants';

runFunctionIfCalledFromScript(async () => {
	await storeData(
		['metrics', STORE_NAME, 'structural-complexity'],
		await getStructuralComplexityMetrics()
	);
}, __filename);
