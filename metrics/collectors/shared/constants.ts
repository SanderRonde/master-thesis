import * as path from 'path';

export const MAX_PUPPETEER_BROWSER_LAUNCH_TRIES = 3;

const ROOT_DIR = path.join(__dirname, '../../../');
export const METRICS_DIR = path.join(ROOT_DIR, 'metrics');
export const DASHBOARD_DIR = path.join(
	METRICS_DIR,
	'submodules',
	'30mhz-dashboard'
);
export const BASIC_DASHBOARD_DIR = path.join(
	METRICS_DIR,
	'submodules',
	'30mhz-dashboard-basic'
);
export const TEMP_DIR = path.join(METRICS_DIR, 'temp');
export const CACHE_DIR = path.join(METRICS_DIR, 'cache');
export const SUBMODULES_DIR = path.join(METRICS_DIR, 'submodules')
export const COLLECTORS_DIR = path.join(METRICS_DIR, 'collectors');
export const TEMPLATES_DIR = path.join(COLLECTORS_DIR, 'shared/template-files');
