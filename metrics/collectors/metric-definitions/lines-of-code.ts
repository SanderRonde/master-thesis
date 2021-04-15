import { calculate as calculateLOC } from 'ts-complex/lib/src/services/sloc.service';
import { readFile } from '../shared/files';
import { ReadFile } from './types';

export async function getFileLinesOfCode(file: ReadFile): Promise<number> {
	return calculateLOC(await readFile(file.filePath));
}
