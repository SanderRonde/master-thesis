import * as path from 'path';

import { DASHBOARD_DIR } from '../../shared/constants';

export const DASHBOARD_DIST_DIR = path.join(DASHBOARD_DIR, 'dist', 'dashboard');
export const DASHBOARD_IGNORED_DIR = path.join(DASHBOARD_DIR, 'tmp');

export const DASHBOARD_EXCLUDED_FILES = [
	'ngsw-worker.js',
	'extended-service-worker.js',
	'safety-worker.js',
	'worker-basic.min.js',
	'concatenated.js',
	'bundle.js',
];
