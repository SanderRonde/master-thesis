import * as fs from 'fs-extra';
import * as path from 'path';
import { ComponentFiles } from '../../metric-definitions/types';

import { readFile } from '../../shared/files';
import { asyncFilter } from '../../shared/helpers';
import { GetComponentFunction } from '../../shared/shapes';

const IGNORED = new Set(['dialog-bottom-sheet', 'dialog-plugin']);

export async function getComponentFiles(dir: string): Promise<ComponentFiles> {
	const componentName = path.parse(dir).base;
	const mainFile = path.join(dir, `index.js`);

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
): ReturnType<GetComponentFunction> {
	const packagesPath = path.join(submodulePath, 'ui/src/components');
	const dirList = await asyncFilter(
		await fs.readdir(packagesPath),
		async (dir) => {
			return (await fs.stat(path.join(packagesPath, dir))).isDirectory();
		}
	);

	const components = await Promise.all(
		dirList
			.filter((dir) => !IGNORED.has(dir))
			.map((dir) => getComponentFiles(path.join(packagesPath, dir)))
	);

	return {
		components,
		extraLevels: 1,
	};
}
