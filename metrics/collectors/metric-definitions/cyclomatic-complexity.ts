import tsComplex from 'ts-complex';
import { ReadFile } from '../cow-components/dashboard/lib/get-components';

export function getFileCyclomaticComplexity(file: ReadFile): number {
	const cyclomaticComplexities = tsComplex.calculateCyclomaticComplexity(
		file.filePath
	);
	return Object.values(cyclomaticComplexities).reduce(
		(prev, current) => prev + current,
		0
	);
}
