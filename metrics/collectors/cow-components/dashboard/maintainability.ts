import { calculateMaintainability } from 'ts-complex';

import { runFunctionIfCalledFromScript } from '../../shared/helpers';
import { storeData } from '../../shared/storage';
import { ReadFile } from './lib/get-components';
import { collectDashboardMetrics } from './lib/shared';

export async function getFileMaintainability(file: ReadFile): Promise<number> {
	return calculateMaintainability(file.filePath).averageMaintainability;
}

export async function getMaintainabilityMetrics() {
	return await collectDashboardMetrics(getFileMaintainability);
}

runFunctionIfCalledFromScript(async () => {
	await storeData(
		['metrics', 'cow-components', 'dashboard', 'maintainability'],
		await getMaintainabilityMetrics()
	);
}, __filename);
