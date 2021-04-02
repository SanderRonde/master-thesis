import * as fs from 'fs-extra';
import * as path from 'path';
import { glob } from 'glob';

import { ComponentFiles } from '../../cow-components/dashboard/lib/get-components';
import { readFile } from '../../shared/files';
import { asyncFilter } from '../../shared/helpers';
import { flatten } from '../../../submodules/30mhz-dashboard/src/lib/web-components/src/api/helpers';

const COMPONENT_NAME_REGEX = /export class (\w+)/;

async function getComponentFiles(dirName: string): Promise<ComponentFiles[]> {
	return new Promise<ComponentFiles[]>((resolve, reject) => {
		glob(path.join(dirName, '*.element.ts'), (err, files) => {
			if (err) {
				reject(err);
			} else {
				resolve(
					Promise.all(
						files.map(async (filePath) => {
							const source = await readFile(filePath);
							const regexMatch = COMPONENT_NAME_REGEX.exec(
								source
							);
							if (!regexMatch) {
								throw new Error(
									'Failed to find component name'
								);
							}
							const componentName = regexMatch[1];

							return {
								js: {
									componentName,
									content: source,
									filePath: filePath,
								},
								html: null,
							};
						})
					)
				);
			}
		});
	});
}

export async function getComponents(
	submodulePath: string
): Promise<ComponentFiles[]> {
	const packagesPath = path.join(submodulePath, 'packages/core/src');
	const dirList = await asyncFilter(
		await fs.readdir(packagesPath),
		async (dir) => {
			return (await fs.stat(path.join(packagesPath, dir))).isDirectory();
		}
	);

	const components = await Promise.all(
		dirList.map((dir) => getComponentFiles(path.join(packagesPath, dir)))
	);

	return flatten(components);
}
