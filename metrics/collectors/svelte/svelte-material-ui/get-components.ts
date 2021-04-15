import * as fs from 'fs-extra';
import * as path from 'path';
import { ComponentFiles } from '../../metric-definitions/types';

import { readFile } from '../../shared/files';
import { toCamelCase } from '../../shared/helpers';
import { createComponentFileFromSvelte } from '../shared/util';

const OVERRIDES = new Map([['Chips', 'Chip']]);
const IGNORED = new Set(['common', 'ripple']);

export function dirNameToComponentName(dirName: string) {
	return toCamelCase(dirName, true);
}

export async function getComponentFiles(
	dir: string,
	overrides: Map<string, string>
) {
	const componentName = dirNameToComponentName(path.parse(dir).base);
	const mainFile = path.join(
		dir,
		`${overrides.get(componentName) || componentName}.svelte`
	);

	return createComponentFileFromSvelte(
		await readFile(mainFile),
		componentName,
		mainFile
	);
}

export async function getComponents(
	submodulePath: string
): Promise<ComponentFiles[]> {
	const packagesPath = path.join(submodulePath, 'packages');
	const dirList = await fs.readdir(packagesPath);

	const components = await Promise.all(
		dirList
			.filter((dir) => !IGNORED.has(dir))
			.map((dir) =>
				getComponentFiles(path.join(packagesPath, dir), OVERRIDES)
			)
	);

	return components;
}
