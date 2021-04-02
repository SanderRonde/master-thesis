import * as fs from 'fs-extra';
import * as path from 'path';

import { ComponentFiles } from '../../cow-components/dashboard/lib/get-components';
import { SUBMODULES_DIR } from '../../shared/constants';
import { readFile } from '../../shared/files';
import { asyncFilter } from '../../shared/helpers';

async function getComponentFiles(mainFile: string): Promise<ComponentFiles> {
	const componentName = path.parse(mainFile).name;

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
	const packagesPath = path.join(submodulePath, 'src');
	const dirList = await asyncFilter(
		await fs.readdir(packagesPath),
		async (dir) => {
			return !(await fs.stat(path.join(packagesPath, dir))).isDirectory();
		}
	);

	const components = await Promise.all(
		dirList
			.filter((dir) => dir[0].toLowerCase() !== dir[0])
			.map((dir) => getComponentFiles(path.join(packagesPath, dir)))
	);

	return components;
}
