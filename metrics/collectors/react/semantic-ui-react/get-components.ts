import * as fs from 'fs-extra';
import * as path from 'path';
import { ComponentFiles } from '../../metric-definitions/types';

import { readFile } from '../../shared/files';
import { asyncFilter } from '../../shared/helpers';

async function getComponentFiles(dirName: string): Promise<ComponentFiles> {
	const componentName = path.parse(dirName).base;
	const filePath = path.join(dirName, `${componentName}.js`);

	return {
		js: {
			componentName,
			content: await readFile(filePath),
			filePath: filePath,
		},
		html: null,
	};
}

export async function getComponents(
	submodulePath: string
): Promise<ComponentFiles[]> {
	const packagesPath = path.join(submodulePath, 'src/elements');
	const dirList = await asyncFilter(
		await fs.readdir(packagesPath),
		async (dir) => {
			return (await fs.stat(path.join(packagesPath, dir))).isDirectory();
		}
	);

	const components = await Promise.all(
		dirList
			.filter((dir) => dir[0].toLowerCase() !== dir[0])
			.map((dir) => getComponentFiles(path.join(packagesPath, dir)))
	);

	return components;
}
