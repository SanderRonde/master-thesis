import * as path from 'path';

import { runFunctionIfCalledFromScript } from '../../shared/helpers';
import { storeData } from '../../shared/storage';
import { getLoadTimeForDir } from '../../metric-definitions/load-time';
import { STORE_NAME } from './lib/constants';
import { NATIVE_DEMO_METRICS_TOGGLEABLE_DIR } from '../../../scripts/metrics/bundles/cow-components/cow-components-native';

runFunctionIfCalledFromScript(async () => {
	await storeData(
		['metrics', 'cow-components-basic', STORE_NAME, 'load-time'],
		await getLoadTimeForDir(path.join(NATIVE_DEMO_METRICS_TOGGLEABLE_DIR))
	);
}, __filename);
