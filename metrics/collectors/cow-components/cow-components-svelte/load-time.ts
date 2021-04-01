import * as path from 'path';

import { runFunctionIfCalledFromScript } from '../../shared/helpers';
import { storeData } from '../../shared/storage';
import { getLoadTimeForDir } from '../../shared/load-time';
import { STORE_NAME } from './lib/constants';
import { SVELTE_DEMO_METRICS_TOGGLEABLE_DIR } from '../../../scripts/metrics/bundles/cow-components/cow-components-svelte';

runFunctionIfCalledFromScript(async () => {
	await storeData(
		['metrics', STORE_NAME, 'load-time'],
		await getLoadTimeForDir(path.join(SVELTE_DEMO_METRICS_TOGGLEABLE_DIR))
	);
}, __filename);
