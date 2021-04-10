import * as path from 'path';

import { BASIC_DASHBOARD_DIR } from '../../shared/constants';
import { runFunctionIfCalledFromScript } from '../../shared/helpers';
import { storeData } from '../../shared/storage';
import { LoadTime } from '../../shared/types';
import { getLoadTimeForDir } from '../../shared/load-time';

const DASHBOARD_DIST_DIR = path.join(BASIC_DASHBOARD_DIR, 'dist', 'dashboard');

export function getDashboardLoadTime(): Promise<LoadTime> {
	return getLoadTimeForDir(DASHBOARD_DIST_DIR, 'bundle.js');
}

runFunctionIfCalledFromScript(async () => {
	await storeData(
		['metrics', 'cow-components', 'dashboard', 'load-time'],
		await getDashboardLoadTime()
	);
}, __filename);
