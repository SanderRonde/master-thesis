import { calculate as calculateLOC } from 'ts-complex/lib/src/services/sloc.service';
import * as fs from 'fs-extra';

import { runFunctionIfCalledFromScript } from '../shared/helpers';
import { storeData } from '../shared/storage';
import { ReadFile } from './get-components';
import { collectDashboardMetrics } from './shared';

export async function getFileLinesOfCode(file: ReadFile): Promise<number> {
	return calculateLOC(
		await fs.readFile(file.filePath, {
			encoding: 'utf8',
		})
	);
}

runFunctionIfCalledFromScript(async () => {
	await storeData(
		['metrics', 'dashboard', 'lines-of-code'],
		collectDashboardMetrics(getFileLinesOfCode)
	);
}, __filename);
