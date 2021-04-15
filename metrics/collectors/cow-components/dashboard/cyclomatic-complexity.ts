import { getFileCyclomaticComplexity } from '../../metric-definitions/cyclomatic-complexity';

import { runFunctionIfCalledFromScript } from '../../shared/helpers';
import { storeData } from '../../shared/storage';
import { collectDashboardMetrics } from './lib/shared';

export async function getCyclomaticComplexityMetrics() {
	return await collectDashboardMetrics(getFileCyclomaticComplexity);
}

runFunctionIfCalledFromScript(async () => {
	await storeData(
		['metrics', 'cow-components', 'dashboard', 'cyclomatic-complexity'],
		await getCyclomaticComplexityMetrics()
	);
}, __filename);
