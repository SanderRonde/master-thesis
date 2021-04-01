import * as fs from 'fs-extra';
import * as path from 'path';

import { ANGULAR_METADATA_BUNDLE } from '../../../scripts/metrics/bundles/cow-components/cow-components-angular';
import { runFunctionIfCalledFromScript } from '../../shared/helpers';
import { storeData } from '../../shared/storage';
import { STORE_NAME } from './lib/constants';

export async function getDashboardSize(): Promise<number> {
	return (await fs.stat(path.join(ANGULAR_METADATA_BUNDLE, 'bundle.js')))
		.size;
}

runFunctionIfCalledFromScript(async () => {
	await storeData(['metrics', STORE_NAME, 'size'], await getDashboardSize());
}, __filename);
