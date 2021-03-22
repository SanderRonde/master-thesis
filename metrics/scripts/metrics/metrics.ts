import { choice, cmd, flag } from 'makfy';
import * as fs from 'fs-extra';
import * as path from 'path';
import { DASHBOARD_DIR, METRICS_DIR } from '../../collectors/shared/constants';
import { preserveCommandBuilder } from '../lib/makfy-helper';

import './bundles/dashboard';

const __BUNDLES = ['dashboard'] as const;
const __METRICS = [
	'structural-complexity',
	'cyclomatic-complexity',
	'lines-of-code',
	'maintainability',
] as const;
export type Bundle = typeof __BUNDLES[Extract<keyof typeof __BUNDLES, number>];
export type Metric = typeof __METRICS[Extract<keyof typeof __METRICS, number>];

const BUNDLES = ['dashboard'] as Bundle[];

const METRICS = [
	'structural-complexity',
	'cyclomatic-complexity',
	'lines-of-code',
	'maintainability',
] as Metric[];

export const metris = preserveCommandBuilder(
	cmd('metrics')
		.desc('Collect metrics')
		.args({
			'skip-dashboard': flag(),
			bundle: choice([...BUNDLES, 'all'], 'all'),
			metric: choice([...METRICS, 'all'], 'all'),
		})
		.argsDesc({
			'skip-dashboard': 'Skip installing of dashboard',
			bundle: 'A specific bundle to use. Uses all by default',
			metric: 'A specific metric to gather. Uses all by default',
		})
).run(async (exec, args) => {
	const packagesInstalledFile = path.join(DASHBOARD_DIR, 'dist/installed');
	const bundles: Bundle[] = args.bundle !== 'all' ? [args.bundle] : BUNDLES;
	const metrics: Metric[] = args.metric !== 'all' ? [args.metric] : METRICS;

	if (
		!args['skip-dashboard'] &&
		!(await fs.pathExists(packagesInstalledFile))
	) {
		await exec('? Copying environment files');
		await fs.copyFile(
			path.join(DASHBOARD_DIR, 'src/environments/environment.ts.txt'),
			path.join(DASHBOARD_DIR, 'src/environments/environment.ts')
		);
		await fs.copyFile(
			path.join(DASHBOARD_DIR, 'src/environments/version.ts.txt'),
			path.join(DASHBOARD_DIR, 'src/environments/version.ts')
		);

		await exec('? Installing dashboard dependencies');
		await exec(`npm install -C ${DASHBOARD_DIR}`);

		await exec('? Marking as installed');
		await fs.writeFile(packagesInstalledFile, '');
	}

	if (bundles.includes('dashboard')) await exec('? Collecting metrics');
	await exec(
		bundles.flatMap((bundle) => {
			return metrics.map((metric) => {
				return `ts-node -T ${path.join(
					METRICS_DIR,
					`collectors/${bundle}/${metric}.ts`
				)}`;
			});
		})
	);
});
