import * as fs from 'fs-extra';
import * as path from 'path';
import { ComponentFiles } from '../../metric-definitions/types';

import { readFile } from '../../shared/files';
import { asyncFilter } from '../../shared/helpers';
import { dirNameToComponentName } from '../../svelte/svelte-material-ui/get-components';

const IGNORED = new Set([
	'badgedirective',
	'api',
	'common',
	'config',
	'confirmationeventbus',
	'confirmationservice',
	'overlayeventbus',
	'ripple',
	'terminalservice',
	'toasteventbus',
	'toastservice',
	'tooltip',
	'useconfirm',
	'usetoast',
	'utils',
]);

async function findFileCaseInsensitive(dir: string, fileName: string) {
	const filesInDir = await fs.readdir(dir);
	return filesInDir.find((fileInDir) => {
		return fileInDir.toLowerCase() === fileName.toLowerCase();
	});
}

export async function getComponentFiles(dir: string): Promise<ComponentFiles> {
	const componentName = dirNameToComponentName(path.parse(dir).base);
	const fileName = await findFileCaseInsensitive(dir, `${componentName}.vue`);
	if (!fileName) {
		throw new Error(
			`Failed to find matching file for "${componentName}" in "${dir}"`
		);
	}
	const mainFile = path.join(dir, fileName);

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
	const packagesPath = path.join(submodulePath, 'src/components');
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