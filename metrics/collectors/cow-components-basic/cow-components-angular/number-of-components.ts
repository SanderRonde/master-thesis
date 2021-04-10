import { getNumberOfComponents } from '../dashboard/number-of-components';
import { runFunctionIfCalledFromScript } from '../../shared/helpers';
import { storeData } from '../../shared/storage';
import { STORE_NAME } from './lib/constants';

runFunctionIfCalledFromScript(async () => {
	await storeData(
		['metrics', 'cow-components', STORE_NAME, 'number-of-components'],
		await getNumberOfComponents()
	);
}, __filename);
