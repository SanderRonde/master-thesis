import { runFunctionIfCalledFromScript } from '../../shared/helpers';
import { storeData } from '../../shared/storage';
import { getLoadTimeForDir } from '../../shared/load-time';
import { STORE_NAME } from './lib/constants';
import { ANGULAR_METADATA_BUNDLE } from '../../../scripts/metrics/bundles/cow-components/cow-components-angular';

runFunctionIfCalledFromScript(async () => {
	await storeData(
		['metrics', 'cow-components', STORE_NAME, 'load-time'],
		await getLoadTimeForDir(ANGULAR_METADATA_BUNDLE, 'bundle.js')
	);
}, __filename);
