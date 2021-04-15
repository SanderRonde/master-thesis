import { calculate as calculateLOC } from 'ts-complex/lib/src/services/sloc.service';

import { runFunctionIfCalledFromScript } from '../../shared/helpers';
import { storeData } from '../../shared/storage';
import { collectDashboardMetrics } from './lib/shared';
import { readFile } from '../../shared/files';
import { ReadFile } from '../../metric-definitions/types';

export async function getFileLinesOfCode(file: ReadFile): Promise<number> {
	return calculateLOC(await readFile(file.filePath));
}

export async function getLinesOfCodeMetrics() {
	return await collectDashboardMetrics(getFileLinesOfCode);
}

runFunctionIfCalledFromScript(async () => {
	await storeData(
		['metrics', 'cow-components', 'dashboard', 'lines-of-code'],
		await getLinesOfCodeMetrics()
	);
}, __filename);
