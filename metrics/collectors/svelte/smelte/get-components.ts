import * as fs from 'fs-extra';
import * as path from 'path';

import { ComponentFiles } from '../../cow-components/dashboard/lib/get-components';
import { SUBMODULES_DIR } from '../../shared/constants';
import { getComponentFiles } from '../svelte-material-ui/get-components';

const OVERRIDES = new Map();
const IGNORED = new Set(['Util']);

export async function getComponents(
	submodulePath: string
): Promise<ComponentFiles[]> {
	const packagesPath = path.join(submodulePath, 'src/components');
	const dirList = await fs.readdir(packagesPath);

	const components = await Promise.all(
		dirList
			.filter((dir) => !IGNORED.has(dir))
			.map((dir) =>
				getComponentFiles(path.join(packagesPath, dir), OVERRIDES)
			)
	);

	return components;
}

getComponents(path.join(SUBMODULES_DIR, 'smelte'));
