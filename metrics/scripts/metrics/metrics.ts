import { choice, cmd, flag } from 'makfy';
import { CommandBuilder } from 'makfy/dist/lib/schema/commands';
import * as fs from 'fs-extra';
import * as path from 'path';

import { DASHBOARD_DIR } from '../../collectors/shared/constants';
import {
	getCommandBuilderExec,
	preserveCommandBuilder,
} from '../lib/makfy-helper';
import './bundles/dashboard';
import { dashboardMetrics } from './bundles/dashboard';
import { Bundle, BUNDLES, COW_COMPONENT_BUNDLES } from '../lib/constants';
import { cowComponentsAngularMetrics } from './bundles/cow-components-angular';
import { cowComponentsNativeMetrics } from './bundles/cow-components-native';
import { cowComponentsReactMetrics } from './bundles/cow-components-react';
import { cowComponentsSvelteMetrics } from './bundles/cow-components-svelte';
import { DEMO_REPO_DIR } from '../lib/cow-components-shared';

const bundleMap: {
	[K in Bundle]: CommandBuilder<{}>;
} = {
	dashboard: dashboardMetrics,
	'cow-components-angular': cowComponentsAngularMetrics,
	'cow-components-native': cowComponentsNativeMetrics,
	'cow-components-react': cowComponentsReactMetrics,
	'cow-components-svelte': cowComponentsSvelteMetrics,
};

export const metris = preserveCommandBuilder(
	cmd('metrics')
		.desc('Collect metrics')
		.args({
			'skip-dashboard': flag(),
			bundle: choice([...BUNDLES, 'all'], 'all'),
			'no-cache': flag(),
			prod: flag(),
		})
		.argsDesc({
			'skip-dashboard': 'Skip installing of dashboard',
			bundle: 'A specific bundle to use. Uses all by default',
			'no-cache': "Don't use cache and force rebuild",
			prod: 'Enable production mode',
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
		await exec(`npm install -C ${DASHBOARD_DIR} --no-save`);

		await exec('? Marking as installed');
		await fs.mkdirp(path.dirname(packagesInstalledFile));
		await fs.writeFile(packagesInstalledFile, '');
	}

	if (
		bundles.some((bundle) =>
			COW_COMPONENT_BUNDLES.includes(bundle as any)
		) &&
		!(await fs.pathExists(DEMO_REPO_DIR))
	) {
		await exec('? Building design library and wrappers');
		const dashboardCtx = await exec(`cd ${DASHBOARD_DIR}`);
		await dashboardCtx.keepContext('makfy demo-repo');
	}

	for (const bundle of bundles) {
		await exec(
			getCommandBuilderExec(bundleMap[bundle], {
				'no-cache': args['no-cache'],
				prod: args.prod,
			})
		);
	}
});
