import * as path from 'path';

import { BASIC_DASHBOARD_DIR } from '../../../shared/constants';

export const DASHBOARD_DIST_DIR = path.join(BASIC_DASHBOARD_DIR, 'dist', 'dashboard');
export const DASHBOARD_IGNORED_DIR = path.join(BASIC_DASHBOARD_DIR, 'tmp');

export const ANGULAR_EXCLUDED_FILES = [
	'ngsw-worker.js',
	'extended-service-worker.js',
	'safety-worker.js',
	'worker-basic.min.js',
	'concatenated.js',
	'bundle.js',
];
