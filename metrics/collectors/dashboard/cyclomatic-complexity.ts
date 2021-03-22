import tsComplex from 'ts-complex';

import { runFunctionIfCalledFromScript } from '../shared/helpers';
import { storeData } from '../shared/storage';
import { ReadFile } from './lib/get-components';
import { collectDashboardMetrics } from './lib/shared';

export function getFileCyclomaticComplexity(file: ReadFile): number {
	const cyclomaticComplexities = tsComplex.calculateCyclomaticComplexity(
		file.filePath
	);
	return Object.values(cyclomaticComplexities).reduce(
		(prev, current) => prev + current,
		0
	);
}

runFunctionIfCalledFromScript(async () => {
	await storeData(
		['metrics', 'dashboard', 'cyclomatic-complexity'],
		await collectDashboardMetrics(getFileCyclomaticComplexity)
	);
}, __filename);
