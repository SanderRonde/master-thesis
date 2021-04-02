import * as fs from 'fs-extra';
import * as path from 'path';

import { ComponentFiles } from '../../cow-components/dashboard/lib/get-components';
import { readFile } from '../../shared/files';
import { asyncFilter } from '../../shared/helpers';

const COMPONENT_NAME_REGEX = /export class (\w+)/;

const OVERRIDES = new Map([['buttons', ['checkbox', 'radio']]]);
const IGNORED = new Set(['test', 'util']);

async function getComponentFiles(
	dirName: string,
	sourceFileName: string = path.parse(dirName).base
): Promise<ComponentFiles> {
	const tsFilePath = path.join(dirName, `${sourceFileName}.ts`);
	const htmlFilePath = path.join(dirName, `${sourceFileName}.html`);

	const tsSource = await readFile(tsFilePath);
	const regexMatch = COMPONENT_NAME_REGEX.exec(tsSource);
	if (!regexMatch) {
		throw new Error('Failed to find component name');
	}
	const componentName = regexMatch[1];

	return {
		js: {
			componentName,
			content: tsSource,
			filePath: tsFilePath,
		},
		html: (await fs.pathExists(htmlFilePath))
			? {
					componentName,
					content: await readFile(htmlFilePath),
					filePath: htmlFilePath,
			  }
			: null,
	};
}

export async function getComponents(
	submodulePath: string
): Promise<ComponentFiles[]> {
	const packagesPath = path.join(submodulePath, 'src');
	const dirList = await asyncFilter(
		await fs.readdir(packagesPath),
		async (dir) => {
			return (await fs.stat(path.join(packagesPath, dir))).isDirectory();
		}
	);

	const components = await Promise.all(
		dirList
			.filter((dir) => !IGNORED.has(dir))
			.flatMap((dirName) => {
				if (OVERRIDES.has(dirName)) {
					return OVERRIDES.get(dirName)!.map((overriddenName) =>
						getComponentFiles(
							path.join(packagesPath, dirName),
							overriddenName
						)
					);
				}
				return getComponentFiles(path.join(packagesPath, dirName));
			})
	);

	return components;
}
