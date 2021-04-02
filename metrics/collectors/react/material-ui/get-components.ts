import * as fs from 'fs-extra';
import * as path from 'path';

import { ComponentFiles } from '../../cow-components/dashboard/lib/get-components';
import { SUBMODULES_DIR } from '../../shared/constants';
import { readFile } from '../../shared/files';
import { asyncFilter, toCamelCase } from '../../shared/helpers';

const OVERRIDES = new Map();
const IGNORED = new Set([
	'ClickAwayListener',
	'Portal',
	'StyledEngineProvider',
	'Unstable_TrapFocus',
]);

export function dirNameToComponentName(dirName: string) {
	return toCamelCase(dirName, true);
}

export async function getComponentFiles(
	dir: string,
	overrides: Map<string, string>
): Promise<ComponentFiles> {
	const componentName = path.parse(dir).base;
	const mainFile = path.join(dir, `${componentName}.js`);

	return {
		js: {
			componentName,
			content: await readFile(mainFile),
			filePath: mainFile,
		},
		html: null,
	};
}

export async function getComponents(
	submodulePath: string
): Promise<ComponentFiles[]> {
	const packagesPath = path.join(submodulePath, 'packages/material-ui/src');
	const dirList = await asyncFilter(
		await fs.readdir(packagesPath),
		async (dir) => {
			return (await fs.stat(path.join(packagesPath, dir))).isDirectory();
		}
	);

	const components = await Promise.all(
		dirList
			.filter((dir) => !IGNORED.has(dir))
			.filter((dir) => dir[0].toLowerCase() !== dir[0])
			.map((dir) =>
				getComponentFiles(path.join(packagesPath, dir), OVERRIDES)
			)
	);

	return components;
}
