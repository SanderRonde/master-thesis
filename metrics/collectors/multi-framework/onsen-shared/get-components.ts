import * as fs from 'fs-extra';
import * as path from 'path';

import { ComponentFiles } from '../../cow-components/dashboard/lib/get-components';
import { readFile } from '../../shared/files';

const IGNORED = new Set(['base']);
const COMPONENT_NAME_REGEX = /export (default )?class (\w+)/;

export async function getComponentFiles(
	dirOrFile: string
): Promise<ComponentFiles> {
	const mainFile = await (async () => {
		if ((await fs.stat(dirOrFile)).isDirectory()) {
			return path.join(dirOrFile, 'index.js');
		} else {
			return dirOrFile;
		}
	})();

	const mainFileContent = await readFile(mainFile);
	const regexMatch = COMPONENT_NAME_REGEX.exec(mainFileContent);
	if (!regexMatch) {
		throw new Error('Failed to find component name');
	}
	const componentName = regexMatch[1];

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
	const packagesPath = path.join(submodulePath, 'core/src/elements');
	const dirList = await fs.readdir(packagesPath);

	const components = await Promise.all(
		dirList
			.filter((dirOrPath) => !IGNORED.has(dirOrPath))
			.filter((dirOrPath) => !dirOrPath.endsWith('.spec.js'))
			.map((dirOrPath) =>
				getComponentFiles(path.join(packagesPath, dirOrPath))
			)
	);

	return components;
}
