import { runFunctionIfCalledFromScript } from '../../shared/helpers';
import { storeData } from '../../shared/storage';
import { getBasicCowComponents } from './lib/get-components';

async function getNumberOfComponents(): Promise<number> {
	return (await getBasicCowComponents()).length;
}

runFunctionIfCalledFromScript(async () => {
	await storeData(
		['metrics', 'cow-components-basic', 'dashboard-basic', 'number-of-components'],
		await getNumberOfComponents()
	);
}, __filename);
