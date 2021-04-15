import tsComplex from 'ts-complex';
import { ReadFile } from './types';

export function getFileCyclomaticComplexity(file: ReadFile): number {
	const cyclomaticComplexities = tsComplex.calculateCyclomaticComplexity(
		file.filePath
	);
	return Object.values(cyclomaticComplexities).reduce(
		(prev, current) => prev + current,
		0
	);
}
