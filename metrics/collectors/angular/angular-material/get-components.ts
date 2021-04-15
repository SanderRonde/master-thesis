import * as fs from 'fs-extra';
import * as path from 'path';
import { ComponentFiles } from '../../metric-definitions/types';

import { readFile } from '../../shared/files';
import { asyncFilter } from '../../shared/helpers';

const COMPONENT_NAME_REGEX = /export class (\w+)/;

const OVERRIDES = new Map([
	['chips', 'chip'],
	['tabs', 'tab'],
]);
const IGNORED = new Set([
	'core',
	'expansion',
	'prebuilt-themes',
	'schematics',
	'testing',
]);

async function getComponentFiles(dirName: string): Promise<ComponentFiles> {
	let sourceFileName = path.parse(dirName).base;
	if (OVERRIDES.has(sourceFileName)) {
		sourceFileName = OVERRIDES.get(sourceFileName)!;
	}
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
	const packagesPath = path.join(submodulePath, 'src/material');
	const dirList = await asyncFilter(
		await fs.readdir(packagesPath),
		async (dir) => {
			return (await fs.stat(path.join(packagesPath, dir))).isDirectory();
		}
	);

	const components = await Promise.all(
		dirList
			.filter((dir) => !IGNORED.has(dir))
			.map((dirName) =>
				getComponentFiles(path.join(packagesPath, dirName))
			)
	);

	return components;
}
