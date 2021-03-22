import tsComplex from 'ts-complex';

import { runFunctionIfCalledFromScript } from '../shared/helpers';
import { storeData } from '../shared/storage';
import { ReadFile } from './get-components';
import { collectDashboardMetrics } from './shared';

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
		collectDashboardMetrics(getFileCyclomaticComplexity)
	);
}, __filename);
