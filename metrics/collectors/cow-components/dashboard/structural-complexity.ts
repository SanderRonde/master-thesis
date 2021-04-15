import { runFunctionIfCalledFromScript } from '../../shared/helpers';
import { storeData } from '../../shared/storage';
import { createTSProgram } from '../../shared/typescript';
import { collectDashboardMetrics } from './lib/shared';
import { DASHBOARD_DIR } from '../../shared/constants';
import { getFileStructuralComplexity } from '../../shared/cow-components-shared';

export async function getStructuralComplexityMetrics() {
	return await collectDashboardMetrics(
		getFileStructuralComplexity,
		async (components) => {
			const tsProgram = await createTSProgram(
				components.map((component) => component.js.filePath)
			);
			return {
				tsProgram: tsProgram,
				baseDir: DASHBOARD_DIR,
			};
		}
	);
}

runFunctionIfCalledFromScript(async () => {
	await storeData(
		['metrics', 'cow-components', 'dashboard', 'structural-complexity'],
		await getStructuralComplexityMetrics()
	);
}, __filename);
