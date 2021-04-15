import { getFileMaintainability } from '../../metric-definitions/maintainability';

import { runFunctionIfCalledFromScript } from '../../shared/helpers';
import { storeData } from '../../shared/storage';
import { collectDashboardMetrics } from './lib/shared';

export async function getMaintainabilityMetrics() {
	return await collectDashboardMetrics(getFileMaintainability);
}

runFunctionIfCalledFromScript(async () => {
	await storeData(
		['metrics', 'cow-components', 'dashboard', 'maintainability'],
		await getMaintainabilityMetrics()
	);
}, __filename);
