import * as fs from 'fs-extra';
import * as path from 'path';

import { SvelteMaterialUI } from '.';
import { ComponentFiles } from '../../cow-components/dashboard/lib/get-components';
import { readFile } from '../../shared/files';
import { toCamelCase } from '../../shared/helpers';
import { createComponentFileFromSvelte } from '../shared/util';

const OVERRIDES = new Map([['Chips', 'Chip']]);
const IGNORED = new Set(['common', 'ripple']);

function dirNameToComponentName(dirName: string) {
	return toCamelCase(dirName, true);
}

async function getComponentFiles(dir: string) {
	const componentName = dirNameToComponentName(path.parse(dir).base);
	console.log(dir, componentName);
	const mainFile = path.join(
		dir,
		`${OVERRIDES.get(componentName) || componentName}.svelte`
	);

	return createComponentFileFromSvelte(
		await readFile(mainFile),
		componentName
	);
}

export async function getComponents(): Promise<ComponentFiles[]> {
	const packagesPath = path.join(SvelteMaterialUI.submodulePath, 'packages');
	const dirList = await fs.readdir(packagesPath);

	const components = await Promise.all(
		dirList
			.filter((dir) => !IGNORED.has(dir))
			.map((dir) => getComponentFiles(path.join(packagesPath, dir)))
	);

	return components;
}
