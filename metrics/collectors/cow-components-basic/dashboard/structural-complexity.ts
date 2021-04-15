import { runFunctionIfCalledFromScript } from '../../shared/helpers';
import { storeData } from '../../shared/storage';
import { createTSProgram } from '../../shared/typescript';
import { BASIC_DASHBOARD_DIR } from '../../shared/constants';
import { collectDashboardMetrics } from './lib/shared';
import { getFileStructuralComplexity } from '../../shared/cow-components-shared';

export async function getStructuralComplexityMetrics() {
	return await collectDashboardMetrics(
		getFileStructuralComplexity,
		async (components) => {
			const tsProgram = await createTSProgram(
				components.map((component) => component.js.filePath)
			);
			return {
				tsProgram,
				baseDir: BASIC_DASHBOARD_DIR,
			};
		}
	);
}

runFunctionIfCalledFromScript(async () => {
	await storeData(
		[
			'metrics',
			'cow-components-basic',
			'dashboard-basic',
			'structural-complexity',
		],
		await getStructuralComplexityMetrics()
	);
}, __filename);
