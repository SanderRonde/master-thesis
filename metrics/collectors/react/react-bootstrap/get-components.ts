import * as fs from 'fs-extra';
import * as path from 'path';

import { ComponentFiles } from '../../cow-components/dashboard/lib/get-components';
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
	const fileList = await asyncFilter(
		await fs.readdir(packagesPath),
		async (dir) => {
			return !(await fs.stat(path.join(packagesPath, dir))).isDirectory();
		}
	);

	const components = await Promise.all(
		fileList
			.filter((fileName) => fileName[0].toLowerCase() !== fileName[0])
			.map((fileName) =>
				getComponentFiles(path.join(packagesPath, fileName))
			)
	);

	return components;
}
