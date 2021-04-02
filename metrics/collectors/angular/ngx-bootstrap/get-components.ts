import * as fs from 'fs-extra';
import * as path from 'path';
import { glob } from 'glob';

import { ComponentFiles } from '../../cow-components/dashboard/lib/get-components';
import { readFile } from '../../shared/files';
import { asyncFilter } from '../../shared/helpers';

const COMPONENT_NAME_REGEX = /export class (\w+)/;

const IGNORED = new Set(['test', 'util']);

async function getComponentFiles(dirName: string): Promise<ComponentFiles[]> {
	return new Promise<ComponentFiles[]>((resolve, reject) => {
		glob(path.join(dirName, '*.component.ts'), (err, components) => {
			if (err) {
				reject(err);
			} else {
				glob(
					path.join(dirName, '*.directive.ts'),
					(err, directives) => {
						if (err) {
							reject(err);
						} else {
							const files = [...components, ...directives];

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
					}
				);
			}
		});
	});
}

function flatten<A>(arr: A[][]): A[] {
	const result: A[] = [];
	for (const item of arr) {
		if (Array.isArray(item)) {
			result.push(...item);
		} else {
			result.push(item);
		}
	}
	return result;
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
			.map((dirName) => {
				return getComponentFiles(path.join(packagesPath, dirName));
			})
	);

	return flatten(components);
}
