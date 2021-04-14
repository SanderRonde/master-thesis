import { runFunctionIfCalledFromScript } from '../../shared/helpers';
import { storeData } from '../../shared/storage';
import { getComponents } from './lib/get-components';

export async function getNumberOfComponents(): Promise<number> {
	return (await getComponents()).length;
}

runFunctionIfCalledFromScript(async () => {
	await storeData(
		['metrics', 'cow-components', 'dashboard-basic', 'number-of-components'],
		await getNumberOfComponents()
	);
}, __filename);
