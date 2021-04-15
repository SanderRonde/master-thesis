import { calculateMaintainability } from 'ts-complex';
import { ReadFile } from './types';

export async function getFileMaintainability(file: ReadFile): Promise<number> {
	return calculateMaintainability(file.filePath).averageMaintainability;
}
