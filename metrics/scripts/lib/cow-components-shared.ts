import { ExecFunction } from 'makfy/dist/lib/schema/runtime';
import * as path from 'path';

import { DASHBOARD_DIR, METRICS_DIR } from '../../collectors/shared/constants';
import { TS_NODE_COMMAND } from './helpers';

/**
 * Metrics that are the same between cow components
 * and the dashboard
 */
export const SAME_AS_DASHBOARD_METRICS = [
	'structural-complexity',
	'cyclomatic-complexity',
	'lines-of-code',
	'maintainability',
	'number-of-components',
] as const;

export const DEMO_REPO_DIR = path.join(DASHBOARD_DIR, 'dist/demo-repo');

export async function collectSameAsDashboardMetrics(
	exec: ExecFunction,
	frameworkName: string
) {
	const baseDir = path.join(
		METRICS_DIR,
		`collectors/cow-components/cow-components-${frameworkName}`
	);

	await exec('? Collecting same-as-dashboard metrics');
	for (const metric of SAME_AS_DASHBOARD_METRICS) {
		await exec(`${TS_NODE_COMMAND} ${path.join(baseDir, `${metric}.ts`)}`);
	}
}
