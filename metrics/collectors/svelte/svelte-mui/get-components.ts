import * as fs from 'fs-extra';
import * as path from 'path';
import { ComponentFiles } from '../../metric-definitions/types';

import { readFile } from '../../shared/files';
import { asyncFilter } from '../../shared/helpers';
import { createComponentFileFromSvelte } from '../shared/util';
import { dirNameToComponentName } from '../svelte-material-ui/get-components';

const IGNORED = new Set(['Util']);

export async function getComponents(
	submodulePath: string
): Promise<ComponentFiles[]> {
	const packagesPath = path.join(submodulePath, 'src');
	const fileList = await asyncFilter(
		await fs.readdir(packagesPath),
		async (filePath) => {
			return !(
				await fs.stat(path.join(packagesPath, filePath))
			).isDirectory();
		}
	);

	const components = await Promise.all(
		fileList
			.filter((file) => file.endsWith('.svelte'))
			.filter((file) => !IGNORED.has(file))
			.map(async (file) => {
				const filePath = path.join(packagesPath, file);
				return createComponentFileFromSvelte(
					await readFile(filePath),
					dirNameToComponentName(path.parse(filePath).name),
					filePath
				);
			})
	);

	return components;
}
