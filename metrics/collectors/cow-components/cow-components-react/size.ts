import * as fs from 'fs-extra';
import * as path from 'path';

import { REACT_DEMO_METRICS_TOGGLEABLE_DIR } from '../../scripts/metrics/bundles/cow-components-react';
import { runFunctionIfCalledFromScript } from '../shared/helpers';
import { storeData } from '../shared/storage';
import { STORE_NAME } from './lib/constants';

export async function getDashboardSize(): Promise<number> {
	return (
		await fs.stat(
			path.join(REACT_DEMO_METRICS_TOGGLEABLE_DIR, 'index.bundle.js')
		)
	).size;
}

runFunctionIfCalledFromScript(async () => {
	await storeData(['metrics', STORE_NAME, 'size'], await getDashboardSize());
}, __filename);