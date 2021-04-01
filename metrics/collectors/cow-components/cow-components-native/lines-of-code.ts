import { runFunctionIfCalledFromScript } from '../shared/helpers';
import { storeData } from '../shared/storage';
import { getLinesOfCodeMetrics } from '../dashboard/lines-of-code';
import { STORE_NAME } from './lib/constants';

runFunctionIfCalledFromScript(async () => {
	await storeData(
		['metrics', STORE_NAME, 'lines-of-code'],
		await getLinesOfCodeMetrics()
	);
}, __filename);
