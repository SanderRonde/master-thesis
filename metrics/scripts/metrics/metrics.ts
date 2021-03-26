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
import { Bundle, BUNDLES } from '../lib/constants';
import { cowComponentsAngularMetrics } from './bundles/cow-components-angular';
import { cowComponentsLitElementMetrics } from './bundles/cow-components-lit-element';
import { cowComponentsNativeMetrics } from './bundles/cow-components-native';
import { cowComponentsPolymerMetrics } from './bundles/cow-components-polymer';
import { cowComponentsReactMetrics } from './bundles/cow-components-react';
import { cowComponentsSvelteMetrics } from './bundles/cow-components-svelte';
import { cowComponentsVue2Metrics } from './bundles/cow-components-vue2';
import { cowComponentsVue3Metrics } from './bundles/cow-components-vue3';

const bundleMap: {
	[K in Bundle]: CommandBuilder<{}>;
} = {
	dashboard: dashboardMetrics,
	'cow-components-angular': cowComponentsAngularMetrics,
	'cow-components-lit-element': cowComponentsLitElementMetrics,
	'cow-components-native': cowComponentsNativeMetrics,
	'cow-components-polymer': cowComponentsPolymerMetrics,
	'cow-components-react': cowComponentsReactMetrics,
	'cow-components-svelte': cowComponentsSvelteMetrics,
	'cow-components-vue2': cowComponentsVue2Metrics,
	'cow-components-vue3': cowComponentsVue3Metrics,
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

	for (const bundle of bundles) {
		await exec(
			getCommandBuilderExec(bundleMap[bundle], {
				'no-cache': args['no-cache'],
				prod: args.prod,
			})
		);
	}
});
