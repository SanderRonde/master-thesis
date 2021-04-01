import { getCyclomaticComplexityMetrics } from '../dashboard/cyclomatic-complexity';
import { runFunctionIfCalledFromScript } from '../../shared/helpers';
import { storeData } from '../../shared/storage';
import { STORE_NAME } from './lib/constants';

runFunctionIfCalledFromScript(async () => {
	await storeData(
		['metrics', 'cow-components', STORE_NAME, 'cyclomatic-complexity'],
		await getCyclomaticComplexityMetrics()
	);
}, __filename);
