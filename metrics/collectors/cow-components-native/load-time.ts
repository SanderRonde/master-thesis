import * as path from 'path';

import { runFunctionIfCalledFromScript } from '../shared/helpers';
import { storeData } from '../shared/storage';
import { getLoadTimeForDir } from '../shared/load-time';
import { FRAMEWORK_NAME, STORE_NAME } from './lib/constants';
import { DEMO_REPO_DIR } from '../../scripts/lib/cow-components-shared';

runFunctionIfCalledFromScript(async () => {
	await storeData(
		['metrics', STORE_NAME, 'load-time'],
		await getLoadTimeForDir(
			path.join(DEMO_REPO_DIR, FRAMEWORK_NAME, 'metrics', 'empty')
		)
	);
}, __filename);
