import { choice, cmd, flag } from 'makfy';
import * as fs from 'fs-extra';
import * as path from 'path';

import { DASHBOARD_DIR } from '../../collectors/shared/constants';
import {
	getCommandBuilderExec,
	METRICS_COMMAND_ARGS,
	METRICS_COMMAND_ARG_DESCRIPTIONS,
	preserveCommandBuilder,
} from '../lib/makfy-helper';
import { Bundle, BUNDLES } from '../lib/constants';
import { DEMO_REPO_DIR } from '../lib/cow-components-shared';
import { makeChartDeterministic } from '../../collectors/cow-components/dashboard/lib/render-time/generate-render-time-page';
import { writeFile } from '../../collectors/shared/files';
import {
	cowComponentsParallelBundleMap,
	cowComponentsSerialBundleMap,
	COW_COMPONENT_BUNDLES,
} from './bundles/cow-components';
import { ParallelBundleMap, SerialBundleMap } from '../lib/types';
import {
	svelteParallelBundleMap,
	svelteSerialBundleMap,
} from './bundles/svelte';

const parallelBundleMap: ParallelBundleMap<Bundle> = {
	...cowComponentsParallelBundleMap,
	...svelteParallelBundleMap,
};

const serialBundleMap: SerialBundleMap<Bundle> = {
	...cowComponentsSerialBundleMap,
	...svelteSerialBundleMap,
};

export const metris = preserveCommandBuilder(
	cmd('metrics')
		.desc('Collect metrics')
		.args({
			'skip-dashboard': flag(),
			bundle: choice([...BUNDLES, 'all'], 'all'),
			...METRICS_COMMAND_ARGS,
		})
		.argsDesc({
			'skip-dashboard': 'Skip installing of dashboard',
			bundle: 'A specific bundle to use. Uses all by default',
			...METRICS_COMMAND_ARG_DESCRIPTIONS,
		})
).run(async (exec, args) => {
	const packagesInstalledFile = path.join(DASHBOARD_DIR, '.vscode/installed');
	const bundles: Bundle[] = args.bundle !== 'all' ? [args.bundle] : BUNDLES;

	if (
		bundles.some((bundle) =>
			COW_COMPONENT_BUNDLES.includes(bundle as any)
		) &&
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
		await writeFile(packagesInstalledFile, '');
	}

	if (
		(bundles.some((bundle) =>
			COW_COMPONENT_BUNDLES.includes(bundle as any)
		) &&
			!(await fs.pathExists(DEMO_REPO_DIR))) ||
		args['no-cache']
	) {
		const dashboardCtx = await exec(`cd ${DASHBOARD_DIR}`);
		await dashboardCtx.keepContext('git reset --hard');

		await exec('? Making chart deterministic');
		await makeChartDeterministic();

		await exec('? Building design library and wrappers');
		await dashboardCtx.keepContext('makfy demo-repo');

		await dashboardCtx.keepContext('git reset --hard');
	}

	const execArgs = {
		'no-cache': args['no-cache'],
		prod: args.prod,
		'log-debug': args['log-debug'],
	};

	// First do dashboard by itself if we need to
	// because it's a bit of a special case
	if (bundles.includes('dashboard')) {
		await exec(getCommandBuilderExec(serialBundleMap.dashboard, execArgs));
	}

	// Run all parallel tasks
	await exec(
		bundles
			.filter((bundle) => parallelBundleMap[bundle])
			.map((bundle) =>
				getCommandBuilderExec(parallelBundleMap[bundle]!, execArgs)
			)
	);

	// Run all sync tasks
	for (const bundle of bundles) {
		await exec(getCommandBuilderExec(serialBundleMap[bundle], execArgs));
	}
});
