import * as fs from 'fs-extra';
import * as path from 'path';

import { runFunctionIfCalledFromScript } from '../../shared/helpers';
import { storeData } from '../../shared/storage';
import { DASHBOARD_DIST_DIR } from './lib/constants';

export async function getDashboardSize(): Promise<number> {
	return (await fs.stat(path.join(DASHBOARD_DIST_DIR, 'bundle.js'))).size;
}

runFunctionIfCalledFromScript(async () => {
	await storeData(
		['metrics', 'cow-components', 'dashboard', 'size'],
		await getDashboardSize()
	);
}, __filename);
