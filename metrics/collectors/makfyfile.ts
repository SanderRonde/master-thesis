import { cmd, flag } from 'makfy';
import * as fs from 'fs-extra';
import * as path from 'path';
import { DASHBOARD_DIR, METRICS_DIR } from './shared/constants';

cmd('collect')
	.desc('Collect metrics')
	.args({
		'skip-dashboard': flag(),
	})
	.argsDesc({
		'skip-dashboard': 'Skip installing of dashboard',
	})
	.run(async (exec, args) => {
		if (!args['skip-dashboard']) {
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
		}

		await exec('? Collecting metrics');
		// TODO: Add structure here
		await exec(
			`ts-node -T ${path.join(
				METRICS_DIR,
				'collectors/dashboard/structural-complexity.ts'
			)}`
		);
	});
