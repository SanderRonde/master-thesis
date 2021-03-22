import * as path from 'path';

export const ROOT_DIR = path.join(__dirname, '../../../');
export const METRICS_DIR = path.join(ROOT_DIR, 'metrics');
export const DASHBOARD_DIR = path.join(
	METRICS_DIR,
	'submodules',
	'30mhz-dashboard'
);
