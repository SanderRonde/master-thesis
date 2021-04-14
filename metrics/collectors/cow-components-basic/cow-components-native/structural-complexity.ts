import { getStructuralComplexityMetrics } from '../dashboard/structural-complexity';
import { runFunctionIfCalledFromScript } from '../../shared/helpers';
import { storeData } from '../../shared/storage';
import { STORE_NAME } from './lib/constants';

runFunctionIfCalledFromScript(async () => {
	await storeData(
		[
			'metrics',
			'cow-components-basic',
			STORE_NAME,
			'structural-complexity',
		],
		await getStructuralComplexityMetrics()
	);
}, __filename);
