import tsComplex from 'ts-complex';

import {
	runFunctionIfCalledFromScript,
	sortObjectKeys,
} from '../shared/helpers';
import { CyclomaticComplexityData } from '../shared/types';
import { storeData } from '../shared/storage';
import { ComponentFiles, getComponents } from './get-components';

export function getComponentCyclomaticComplexity(
	component: ComponentFiles
): number {
	const cyclomaticComplexities = tsComplex.calculateCyclomaticComplexity(
		component.js.filePath
	);
	return Object.values(cyclomaticComplexities).reduce(
		(prev, current) => prev + current,
		0
	);
}

export async function getCyclomaticComplexity(): Promise<CyclomaticComplexityData> {
	const components = await getComponents();

	const structuralDependencyData: CyclomaticComplexityData = {};
	await Promise.all(
		components.map(async (component) => {
			structuralDependencyData[
				component.js.componentName
			] = getComponentCyclomaticComplexity(component);
		})
	);

	return sortObjectKeys(structuralDependencyData);
}

runFunctionIfCalledFromScript(async () => {
	const cyclomaticComplexity = await getCyclomaticComplexity();
	await storeData(
		['metrics', 'dashboard', 'cyclomatic-complexity'],
		cyclomaticComplexity
	);
}, __filename);
