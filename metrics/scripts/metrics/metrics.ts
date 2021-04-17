import { choice, cmd, flag, str } from 'makfy';
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
} from '../lib/makfy-helper';
import { Bundle, BUNDLES } from '../lib/constants';
import { DEMO_REPO_DIR } from '../lib/cow-components-shared';
import { writeFile } from '../../collectors/shared/files';
import {
	cowComponentBundles,
	cowComponentsInstallBundleMap,
	cowComponentsPageLoadTimeMap,
	cowComponentsParallelBundleMap,
	cowComponentsSerialBundleMap,
	cowComponentsTimeMetricsMap,
	COW_COMPONENT_BUNDLES,
} from './bundles/cow-components';
import {
	cowComponentBasicBundles,
	cowComponentsBasicInstallBundleMap,
	cowComponentsBasicParallelBundleMap,
	cowComponentsBasicSerialBundleMap,
	cowComponentsBasicTimeMetricsMap,
	COW_COMPONENT_BASIC_BUNDLES,
} from './bundles/cow-components-basic';
import {
	ParallelBundleMap,
	SerialBundleMap,
	TimeMetricBundleMap,
} from '../lib/types';
import {
	svelteInstallBundleMap,
	svelteParallelBundleMap,
	svelteSerialBundleMap,
	svelteTimeMetricsMap,
} from './bundles/svelte';
import {
	reactInstallBundleMap,
	reactParallelBundleMap,
	reactSerialBundleMap,
	reactTimeMetricsMap,
} from './bundles/react';
import {
	angularInstallBundleMap,
	angularParallelBundleMap,
	angularSerialBundleMap,
	angularTimeMetricsMap,
} from './bundles/angular';
import {
	webcomponentsInstallBundleMap,
	webcomponentsParallelBundleMap,
	webcomponentsSerialBundleMap,
	webcomponentsTimeMetricsMap,
} from './bundles/web-components';
import {
	multiFrameworkInstallBundleMap,
	multiFrameworkParallelBundleMap,
	multiFrameworkSerialBundleMap,
	multiFrameworkTimeMetricsMap,
} from './bundles/multi-framework';
import { ExecFunction } from 'makfy/dist/lib/schema/runtime';
import {
	getRenderTimePageDirs,
	makeChartDeterministic,
} from '../../collectors/shared/dashboard/generate-render-time-page';
import {
	vueInstallBundleMap,
	vueParallelBundleMap,
	vueSerialBundleMap,
	vueTimeMetricsMap,
} from './bundles/vue';
import {
	PerBundleLoadTimeMetricConfig,
	setupLoadTimeMeasuring,
	setupRenderTimeMeasuring,
} from '../lib/time-metrics';
import { shuffle } from '../lib/helpers';
import { info } from '../../collectors/shared/log';
import { setupPageLoadTimeMeasuring } from '../lib/page-load';

const installCommandMap: Partial<SerialBundleMap<Bundle>> = {
	...cowComponentsInstallBundleMap,
	...cowComponentsBasicInstallBundleMap,
	...svelteInstallBundleMap,
	...reactInstallBundleMap,
	...angularInstallBundleMap,
	...webcomponentsInstallBundleMap,
	...multiFrameworkInstallBundleMap,
	...vueInstallBundleMap,
};

const parallelBundleMap: ParallelBundleMap<Bundle> = {
	...cowComponentsParallelBundleMap,
	...cowComponentsBasicParallelBundleMap,
	...svelteParallelBundleMap,
	...reactParallelBundleMap,
	...angularParallelBundleMap,
	...webcomponentsParallelBundleMap,
	...multiFrameworkParallelBundleMap,
	...vueParallelBundleMap,
};

const serialBundleMap: SerialBundleMap<Bundle> = {
	...cowComponentsSerialBundleMap,
	...cowComponentsBasicSerialBundleMap,
	...svelteSerialBundleMap,
	...reactSerialBundleMap,
	...angularSerialBundleMap,
	...webcomponentsSerialBundleMap,
	...multiFrameworkSerialBundleMap,
	...vueSerialBundleMap,
};

const timeMetricsBundleMap: TimeMetricBundleMap<Bundle> = {
	...cowComponentsTimeMetricsMap,
	...cowComponentsBasicTimeMetricsMap,
	...svelteTimeMetricsMap,
	...reactTimeMetricsMap,
	...angularTimeMetricsMap,
	...webcomponentsTimeMetricsMap,
	...multiFrameworkTimeMetricsMap,
	...vueTimeMetricsMap,
};

async function execCwd(exec: ExecFunction, cmd: string, cwd: string) {
	const ctx = await exec(`cd ${cwd}`);
	await ctx.keepContext(cmd);
}

async function buildDemoRepo(
	exec: ExecFunction,
	baseDir: string,
	submoduleName: string
) {
	const dashboardCtx = await exec(`cd ${baseDir}`);
	await dashboardCtx.keepContext('git reset --hard');

	await exec('? Making chart deterministic');
	makeChartDeterministic(getRenderTimePageDirs(baseDir, submoduleName));

	await exec('? Building design library and wrappers');

	await dashboardCtx.keepContext('makfy demo-repo');
	// We only build these frameworks, making sure we get around the
	// issue of building storybook. Also building storybook etc is not
	// needed so it's wasted time
	for (const framework of ['native', 'react', 'svelte']) {
		const frameworkDir = path.join(baseDir, 'dist/demo-repo', framework);
		await execCwd(exec, 'npm install', frameworkDir);
		await execCwd(exec, 'yarn build', frameworkDir);
	}
	// Handle the angular case a bit differently
	const frameworkDir = path.join(baseDir, 'dist/demo-repo', 'angular');
	const cowComponentsLibCtx = await exec(
		`cd ${path.join(frameworkDir, 'packages/angular/cow-components-lib')}`
	);
	await cowComponentsLibCtx.keepContext('npm link');
	await execCwd(exec, 'npm install', frameworkDir);
	await execCwd(exec, 'yarn build', frameworkDir);

	await dashboardCtx.keepContext('git reset --hard');
	await dashboardCtx.keepContext('npm install');
}

cmd('metrics')
	.desc('Collect metrics')
	.args({
		'skip-dashboard': flag(),
		bundle: choice([...BUNDLES, 'all'], 'all'),
		'bundle-list': str(''),
		'all-but-bundles': str(''),
		'skip-build': flag(),
		...METRICS_COMMAND_ARGS,
	})
	.argsDesc({
		'skip-dashboard': 'Skip installing of dashboard',
		'skip-build': 'Skip the build process of the current bundle',
		bundle: 'A specific bundle to use. Uses all by default',
		'bundle-list':
			'A comma-separated list of bundles whose metrics to collect',
		...METRICS_COMMAND_ARG_DESCRIPTIONS,
	})
	.run(async (exec, args) => {
		const bundles: Bundle[] = (() => {
			if (args.bundle !== 'all') {
				return [args.bundle];
			}
			if (args['bundle-list'] && args['bundle-list'] !== '') {
				return args['bundle-list'].split(',') as Bundle[];
			}
			if (args['all-but-bundles'] && args['all-but-bundles'] !== '') {
				const allButBundlesList = args['all-but-bundles'].split(
					','
				) as Bundle[];
				return BUNDLES.filter(
					(bundle) => !allButBundlesList.includes(bundle)
				);
			}
			return BUNDLES;
		})();

		for (const dashboardDir of [DASHBOARD_DIR, BASIC_DASHBOARD_DIR]) {
			const isBasic = dashboardDir === BASIC_DASHBOARD_DIR;

			const packagesInstalledFile = path.join(
				dashboardDir,
				'.vscode/installed'
			);

			const hasCowComponentBundle = bundles.some((bundle) =>
				(isBasic
					? COW_COMPONENT_BASIC_BUNDLES
					: COW_COMPONENT_BUNDLES
				).includes(bundle as never)
			);
			const hasDashboardBundle = bundles.some((bundle) =>
				(isBasic
					? cowComponentBasicBundles
					: cowComponentBundles
				).includes(bundle as never)
			);
			if (
				(hasCowComponentBundle || hasDashboardBundle) &&
				!args['skip-dashboard'] &&
				!(await fs.pathExists(packagesInstalledFile))
			) {
				await exec('? Copying environment files');
				await fs.copyFile(
					path.join(
						dashboardDir,
						'src/environments/environment.ts.txt'
					),
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
				hasCowComponentBundle &&
				(!(await fs.pathExists(DEMO_REPO_DIR)) || args['no-cache'])
			) {
				await buildDemoRepo(
					exec,
					dashboardDir,
					isBasic ? '30mhz-dashboard-basic' : '30mhz-dashboard'
				);
			}
		}

		const execArgs = {
			'no-cache': args['no-cache'],
			prod: args.prod,
			'log-debug': args['log-debug'],
			'multi-run': true,
		};

		// First do dashboard by itself if we need to
		// because it's a bit of a special case
		if (bundles.includes('dashboard')) {
			await exec(
				getCommandBuilderExec(serialBundleMap.dashboard, execArgs)
			);
		}
		if (bundles.includes('basic-dashboard')) {
			await exec(
				getCommandBuilderExec(
					serialBundleMap['basic-dashboard'],
					execArgs
				)
			);
		}

		const nonDashboardBundles = bundles.filter(
			(bundle) => !['dashboard', 'basic-dashboard'].includes(bundle)
		);

		// Run all install tasks
		await exec('? Running non-dashboard tasks');
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
						getCommandBuilderExec(
							parallelBundleMap[bundle]!,
							execArgs
						)
					)
			);
		}

		// Run all sync tasks
		await exec('? Running synchronous tasks');
		for (const bundle of nonDashboardBundles) {
			await exec(
				getCommandBuilderExec(serialBundleMap[bundle], execArgs)
			);
		}

		// Set up load and render time queues
		const commands: {
			fn: () => Promise<void>;
			bundle: string;
		}[] = [];
		for (const bundle of nonDashboardBundles) {
			if (!timeMetricsBundleMap[bundle]) {
				continue;
			}
			const bundleConfig =
				timeMetricsBundleMap[
					bundle as keyof typeof timeMetricsBundleMap
				];
			const config: PerBundleLoadTimeMetricConfig = {
				...bundleConfig!,
				bundleName: bundle,
			};
			commands.push(
				...(await setupLoadTimeMeasuring(config)).map((fn) => ({
					fn,
					bundle,
				}))
			);
			commands.push(
				...(await setupRenderTimeMeasuring(config)).map((fn) => ({
					fn,
					bundle,
				}))
			);
		}
		for (const bundle of nonDashboardBundles) {
			if (!(cowComponentsPageLoadTimeMap as any)[bundle as any]) {
				continue;
			}

			commands.push(
				...(
					await setupPageLoadTimeMeasuring(
						cowComponentsPageLoadTimeMap[
							bundle as keyof typeof cowComponentsPageLoadTimeMap
						]!
					)
				).map((fn) => ({
					fn,
					bundle,
				}))
			);
		}

		// Randomize order
		const shuffled = shuffle(commands);
		// Run them all
		await exec('? Starting with timing-based tests');
		for (let i = 0; i < shuffled.length; i++) {
			const { bundle, fn } = shuffled[i];
			info(
				'load-time',
				`Running timing test ${i + 1}/${
					shuffled.length
				} (bundle ${bundle})`
			);
			await fn();
		}
		await exec('? Done with timing-based tests');

		// Exit manually
		process.exit(0);
	});
