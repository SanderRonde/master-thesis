import { choice, cmd, flag } from 'makfy';
import * as fs from 'fs-extra';
import * as path from 'path';

import {
	DASHBOARD_DIR,
	BASIC_DASHBOARD_DIR,
} from '../../collectors/shared/constants';
import {
	getCommandBuilderExec,
	METRICS_COMMAND_ARGS,
	METRICS_COMMAND_ARG_DESCRIPTIONS,
	preserveCommandBuilder,
} from '../lib/makfy-helper';
import { Bundle, BUNDLES } from '../lib/constants';
import { DEMO_REPO_DIR } from '../lib/cow-components-shared';
import { makeChartDeterministic } from '../../collectors/cow-components/dashboard/lib/render-time/generate-render-time-page';
import { makeChartDeterministic as makeBasicChartDeterministic } from '../../collectors/cow-components-basic/dashboard/lib/render-time/generate-render-time-page';
import { writeFile } from '../../collectors/shared/files';
import {
	cowComponentsInstallBundleMap,
	cowComponentsParallelBundleMap,
	cowComponentsSerialBundleMap,
	COW_COMPONENT_BUNDLES,
} from './bundles/cow-components';
import {
	cowComponentsBasicInstallBundleMap,
	cowComponentsBasicParallelBundleMap,
	cowComponentsBasicSerialBundleMap,
	COW_COMPONENT_BASIC_BUNDLES,
} from './bundles/cow-components-basic';
import { ParallelBundleMap, SerialBundleMap } from '../lib/types';
import {
	svelteInstallBundleMap,
	svelteParallelBundleMap,
	svelteSerialBundleMap,
} from './bundles/svelte';
import {
	reactInstallBundleMap,
	reactParallelBundleMap,
	reactSerialBundleMap,
} from './bundles/react';
import {
	angularInstallBundleMap,
	angularParallelBundleMap,
	angularSerialBundleMap,
} from './bundles/angular';
import {
	webcomponentsInstallBundleMap,
	webcomponentsParallelBundleMap,
	webcomponentsSerialBundleMap,
} from './bundles/web-components';
import {
	multiFrameworkInstallBundleMap,
	multiFrameworkParallelBundleMap,
	multiFrameworkSerialBundleMap,
} from './bundles/multi-framework';
import { ExecFunction } from 'makfy/dist/lib/schema/runtime';

const installCommandMap: Partial<SerialBundleMap<Bundle>> = {
	...cowComponentsInstallBundleMap,
	...cowComponentsBasicInstallBundleMap,
	...svelteInstallBundleMap,
	...reactInstallBundleMap,
	...angularInstallBundleMap,
	...webcomponentsInstallBundleMap,
	...multiFrameworkInstallBundleMap,
};

const parallelBundleMap: ParallelBundleMap<Bundle> = {
	...cowComponentsParallelBundleMap,
	...cowComponentsBasicParallelBundleMap,
	...svelteParallelBundleMap,
	...reactParallelBundleMap,
	...angularParallelBundleMap,
	...webcomponentsParallelBundleMap,
	...multiFrameworkParallelBundleMap,
};

const serialBundleMap: SerialBundleMap<Bundle> = {
	...cowComponentsSerialBundleMap,
	...cowComponentsBasicSerialBundleMap,
	...svelteSerialBundleMap,
	...reactSerialBundleMap,
	...angularSerialBundleMap,
	...webcomponentsSerialBundleMap,
	...multiFrameworkSerialBundleMap,
};

async function buildDemoRepo(exec: ExecFunction, isBasic: boolean) {
	const dashboardCtx = await exec(
		`cd ${isBasic ? BASIC_DASHBOARD_DIR : DASHBOARD_DIR}`
	);
	await dashboardCtx.keepContext('git reset --hard');

	await exec('? Making chart deterministic');
	await (isBasic ? makeBasicChartDeterministic : makeChartDeterministic)();

	await exec('? Building design library and wrappers');
	await dashboardCtx.keepContext('makfy demo-repo');

	await dashboardCtx.keepContext('git reset --hard');
}

export const metris = preserveCommandBuilder(
	cmd('metrics')
		.desc('Collect metrics')
		.args({
			'skip-dashboard': flag(),
			bundle: choice([...BUNDLES, 'all'], 'all'),
			'skip-build': flag(),
			...METRICS_COMMAND_ARGS,
		})
		.argsDesc({
			'skip-dashboard': 'Skip installing of dashboard',
			'skip-build': 'Skip the build process of the current bundle',
			bundle: 'A specific bundle to use. Uses all by default',
			...METRICS_COMMAND_ARG_DESCRIPTIONS,
		})
).run(async (exec, args) => {
	const bundles: Bundle[] = args.bundle !== 'all' ? [args.bundle] : BUNDLES;

	for (const dashboardDir of [DASHBOARD_DIR, BASIC_DASHBOARD_DIR]) {
		const isBasic = dashboardDir === BASIC_DASHBOARD_DIR;

		const packagesInstalledFile = path.join(
			dashboardDir,
			'.vscode/installed'
		);
		if (
			bundles.some((bundle) =>
				(isBasic
					? COW_COMPONENT_BASIC_BUNDLES
					: COW_COMPONENT_BUNDLES
				).includes(bundle as never)
			) &&
			!args['skip-dashboard'] &&
			!(await fs.pathExists(packagesInstalledFile))
		) {
			await exec('? Copying environment files');
			await fs.copyFile(
				path.join(dashboardDir, 'src/environments/environment.ts.txt'),
				path.join(dashboardDir, 'src/environments/environment.ts')
			);
			await fs.copyFile(
				path.join(dashboardDir, 'src/environments/version.ts.txt'),
				path.join(dashboardDir, 'src/environments/version.ts')
			);

			await exec('? Installing dashboard dependencies');
			await exec(`npm install -C ${dashboardDir} --no-save`);

			await exec('? Marking as installed');
			await writeFile(packagesInstalledFile, '');
		}

		if (
			(bundles.some((bundle) =>
				(isBasic
					? COW_COMPONENT_BASIC_BUNDLES
					: COW_COMPONENT_BUNDLES
				).includes(bundle as never)
			) &&
				!(await fs.pathExists(DEMO_REPO_DIR))) ||
			args['no-cache']
		) {
			await buildDemoRepo(exec, isBasic);
		}
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
	if (bundles.includes('basic-dashboard')) {
		await exec(
			getCommandBuilderExec(serialBundleMap['basic-dashboard'], execArgs)
		);
	}

	const nonDashboardBundles = bundles.filter(
		(bundle) => !['dashboard', 'basic-dashboard'].includes(bundle)
	);

	// Run all install tasks
	for (const bundle of nonDashboardBundles) {
		if (bundle in installCommandMap) {
			await exec(
				getCommandBuilderExec(installCommandMap[bundle]!, execArgs)
			);
		}
	}

	if (!args['skip-build']) {
		// Run all parallel tasks
		await exec(
			nonDashboardBundles
				.filter((bundle) => parallelBundleMap[bundle])
				.map((bundle) =>
					getCommandBuilderExec(parallelBundleMap[bundle]!, execArgs)
				)
		);
	}

	// Run all sync tasks
	for (const bundle of nonDashboardBundles) {
		await exec(getCommandBuilderExec(serialBundleMap[bundle], execArgs));
	}

	// Exit manually
	process.exit(0);
});
