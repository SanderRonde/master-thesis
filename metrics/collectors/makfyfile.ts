import { choice, cmd, flag } from 'makfy';
import * as fs from 'fs-extra';
import * as path from 'path';
import { DASHBOARD_DIR, METRICS_DIR } from './shared/constants';

const BUNDLES = ['dashboard'];

const METRICS = [
	'structural-complexity',
	'cyclomatic-complexity',
	'lines-of-code',
	'maintainability',
];

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
	.run(async (exec, args) => {
		const packagesInstalledFile = path.join(
			DASHBOARD_DIR,
			'dist/installed'
		);
		const bundles = args.bundle !== 'all' ? [args.bundle] : BUNDLES;
		const metrics = args.metric !== 'all' ? [args.metric] : METRICS;

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

		await exec('? Collecting metrics');
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
