import * as fs from 'fs-extra';
import * as path from 'path';
import { DEMO_REPO_DIR } from '../../scripts/lib/cow-components-shared';

import { runFunctionIfCalledFromScript } from '../shared/helpers';
import { storeData } from '../shared/storage';
import { FRAMEWORK_NAME, STORE_NAME } from './lib/constants';

export async function getDashboardSize(): Promise<number> {
	return (
		await fs.stat(
			path.join(
				DEMO_REPO_DIR,
				FRAMEWORK_NAME,
				'metrics',
				'empty',
				'index.bundle.js'
			)
		)
	).size;
}

runFunctionIfCalledFromScript(async () => {
	await storeData(['metrics', STORE_NAME, 'size'], await getDashboardSize());
}, __filename);
