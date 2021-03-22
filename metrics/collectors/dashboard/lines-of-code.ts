import { calculate as calculateLOC } from 'ts-complex/lib/src/services/sloc.service';
import * as fs from 'fs-extra';

import {
	runFunctionIfCalledFromScript,
	sortObjectKeys,
} from '../shared/helpers';
import { LinesOfCode } from '../shared/types';
import { storeData } from '../shared/storage';
import { ComponentFiles, getComponents } from './get-components';

export async function getComponentCyclomaticComplexity(
	component: ComponentFiles
): Promise<number> {
	return calculateLOC(
		await fs.readFile(component.js.filePath, {
			encoding: 'utf8',
		})
	);
}

export async function getLinesOfCode(): Promise<LinesOfCode> {
	const components = await getComponents();

	const structuralDependencyData: LinesOfCode = {};
	await Promise.all(
		components.map(async (component) => {
			structuralDependencyData[
				component.js.componentName
			] = await getComponentCyclomaticComplexity(component);
		})
	);

	return sortObjectKeys(structuralDependencyData);
}

runFunctionIfCalledFromScript(async () => {
	const linesOfCode = await getLinesOfCode();
	await storeData(['metrics', 'dashboard', 'lines-of-code'], linesOfCode);
}, __filename);
