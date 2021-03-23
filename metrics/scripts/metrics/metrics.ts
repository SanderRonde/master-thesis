import { choice, cmd, flag } from 'makfy';
import * as fs from 'fs-extra';
import * as path from 'path';
import { DASHBOARD_DIR, METRICS_DIR } from '../../collectors/shared/constants';
import {
	getCommandBuilderExec,
	preserveCommandBuilder,
} from '../lib/makfy-helper';

import './bundles/dashboard';
import { CommandBuilder } from 'makfy/dist/lib/schema/commands';
import { dashboardMetrics } from './bundles/dashboard';

const __BUNDLES = ['dashboard'] as const;
const __METRICS = [
	'structural-complexity',
	'cyclomatic-complexity',
	'lines-of-code',
	'maintainability',
	'load-time',
	'size',
	'number-of-components',
] as const;
export type Bundle = typeof __BUNDLES[Extract<keyof typeof __BUNDLES, number>];
export type Metric = typeof __METRICS[Extract<keyof typeof __METRICS, number>];

export const BUNDLES = ['dashboard'] as Bundle[];

export const METRICS = [
	'structural-complexity',
	'cyclomatic-complexity',
	'lines-of-code',
	'maintainability',
	'load-time',
	'size',
	'number-of-components',
] as Metric[];

const bundleMap: {
	[K in Bundle]: CommandBuilder<{}>;
} = {
	dashboard: dashboardMetrics,
};

export const metris = preserveCommandBuilder(
	cmd('metrics')
		.desc('Collect metrics')
		.args({
			'skip-dashboard': flag(),
			bundle: choice([...BUNDLES, 'all'], 'all'),
		})
		.argsDesc({
			'skip-dashboard': 'Skip installing of dashboard',
			bundle: 'A specific bundle to use. Uses all by default',
		})
).run(async (exec, args) => {
	const packagesInstalledFile = path.join(DASHBOARD_DIR, '.vscode/installed');
	const bundles: Bundle[] = args.bundle !== 'all' ? [args.bundle] : BUNDLES;

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
		await fs.mkdirp(path.dirname(packagesInstalledFile));
		await fs.writeFile(packagesInstalledFile, '');
	}

	for (const bundle of bundles) {
		await exec(getCommandBuilderExec(bundleMap[bundle]));
	}
});
