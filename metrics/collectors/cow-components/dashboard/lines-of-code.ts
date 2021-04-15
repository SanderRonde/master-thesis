import { runFunctionIfCalledFromScript } from '../../shared/helpers';
import { storeData } from '../../shared/storage';
import { collectDashboardMetrics } from './lib/shared';
import { getFileLinesOfCode } from '../../metric-definitions/lines-of-code';

export async function getLinesOfCodeMetrics() {
	return await collectDashboardMetrics(getFileLinesOfCode);
}

runFunctionIfCalledFromScript(async () => {
	await storeData(
		['metrics', 'cow-components', 'dashboard', 'lines-of-code'],
		await getLinesOfCodeMetrics()
	);
}, __filename);
