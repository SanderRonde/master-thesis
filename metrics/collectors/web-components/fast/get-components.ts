import * as fs from 'fs-extra';
import * as path from 'path';

import { ComponentFiles } from '../../cow-components/dashboard/lib/get-components';
import { readFile } from '../../shared/files';
import { asyncFilter } from '../../shared/helpers';

const COMPONENT_NAME_REGEX = /export class (\w+)/;

const IGNORED = new Set(['utilities', '__test__', 'color', 'styles']);

export async function getComponentFiles(dir: string): Promise<ComponentFiles> {
	const sourceFilePath = path.join(dir, `index.ts`);
	const sourceFileContent = await readFile(sourceFilePath);

	const regexMatch = COMPONENT_NAME_REGEX.exec(sourceFileContent);
	if (!regexMatch) {
		console.log(sourceFilePath);
		throw new Error('Failed to find component name');
	}
	const componentName = regexMatch[1];

	return {
		js: {
			componentName,
			content: sourceFileContent,
			filePath: sourceFilePath,
		},
		html: null,
	};
}

export async function getComponents(
	submodulePath: string
): Promise<ComponentFiles[]> {
	const packagesPath = path.join(
		submodulePath,
		'packages/web-components/fast-components/src'
	);
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

	return components;
}
