import * as fs from 'fs-extra';
import * as path from 'path';

import { registerSetupCommand } from '../../../lib/makfy-helper';
import {
	cpxAsync,
	omitArr,
	rimrafAsync,
	TS_NODE_COMMAND,
} from '../../../lib/helpers';
import { readFile, writeFile } from '../../../../collectors/shared/files';
import { ExecFunction } from 'makfy/dist/lib/schema/runtime';
import { METRICS } from '../../constants';
import { concatIntoBundle } from '../../cow-components-shared';
import { METRICS_DIR } from '../../../../collectors/shared/constants';

type BaseDirs = ReturnType<typeof getDashboardDirs>;

function getDashboardDirs(baseDir: string, scriptsBaseDir: string) {
	return {
		baseDir,
		distDir: path.join(baseDir, 'dist/dashboard'),
		ignoredDir: path.join(baseDir, 'tmp'),
		browsersListFile: path.join(baseDir, 'browserslist'),
		angularProjectFile: path.join(baseDir, 'angular.json'),
		// TODO: join?
		scriptsDir: path.join(
			METRICS_DIR,
			'collectors',
			scriptsBaseDir,
			'dashboard'
		),
	};
}

async function preDashboardBuild(exec: ExecFunction, dirs: BaseDirs) {
	await exec('? Changing browser target to speed things up');
	await writeFile(dirs.browsersListFile, 'last 2 Chrome versions\n');

	await exec('? Changing output dir');
	const projectFile = JSON.parse(await readFile(dirs.angularProjectFile));
	projectFile.projects.zensie.architect.build.options.outputPath =
		'dist/dashboard';
	await writeFile(dirs.angularProjectFile, JSON.stringify(projectFile));
}

async function postDashboardBuild(exec: ExecFunction, dirs: BaseDirs) {
	const dashboardCtx = await exec(`cd ${dirs.baseDir}`);

	await exec('? Changing browser target back');
	await dashboardCtx.keepContext(`git checkout ${dirs.browsersListFile}`);

	await exec('? Changing output dir back');
	await dashboardCtx.keepContext(`git checkout ${dirs.angularProjectFile}`);
}

async function buildDashboard(
	exec: ExecFunction,
	dirs: BaseDirs,
	cacheDir: string,
	noCache: boolean = false
) {
	const fullCachePath = path.join(dirs.ignoredDir, 'cached', cacheDir);
	if (!noCache && (await fs.pathExists(fullCachePath))) {
		await rimrafAsync(dirs.distDir);
		await fs.mkdirp(dirs.distDir);
		await cpxAsync(path.join(fullCachePath, '**'), dirs.distDir, {
			clean: true,
			includeEmptyDirs: true,
		});
		return;
	}

	await preDashboardBuild(exec, dirs);

	await exec('? Building dashboard');
	await exec(`yarn --cwd ${dirs.baseDir} makfy build`);

	await postDashboardBuild(exec, dirs);

	await rimrafAsync(fullCachePath);
	await fs.mkdirp(fullCachePath);
	await cpxAsync(path.join(dirs.distDir, '**'), fullCachePath);
}

async function dashboardPreBundleMetrics(
	exec: ExecFunction,
	dirs: BaseDirs,
	noCache: boolean
) {
	await buildDashboard(exec, dirs, 'pre-metrics', noCache);

	await concatIntoBundle(exec, dirs.distDir);
}

export function createDashboardMetricsCommand(
	commandName: string,
	baseDir: string,
	scriptsBaseDir: string
) {
	const dirs = getDashboardDirs(baseDir, scriptsBaseDir);

	return registerSetupCommand(commandName).run(async (exec, args) => {
		const dashboardCtx = await exec(`cd ${baseDir}`);
		await dashboardCtx.keepContext('git reset --hard');

		await exec('? Preparing bundle');
		await dashboardPreBundleMetrics(exec, dirs, args['no-cache']);

		await exec('? Collecting non time sensitive metrics');
		await Promise.all(
			omitArr(METRICS, 'render-time').map((metric) => {
				return exec(
					`${TS_NODE_COMMAND} ${path.join(
						dirs.scriptsDir,
						`${metric}.ts`
					)}`
				);
			})
		);

		await exec('? Collecting load time');
		await exec(
			`${TS_NODE_COMMAND} ${path.join(dirs.scriptsDir, `load-time.ts`)}`
		);

		await dashboardCtx.keepContext('git reset --hard');

		await exec('? Preparing for render time measuring');
		await exec(
			`${TS_NODE_COMMAND} ${path.join(
				dirs.scriptsDir,
				`lib/render-time/generate-render-time-page.ts`
			)}`
		);

		await buildDashboard(exec, dirs, 'render-time', args['no-cache']);

		await exec(
			`${TS_NODE_COMMAND} ${path.join(dirs.scriptsDir, `render-time.ts`)}`
		);

		await dashboardCtx.keepContext('git reset --hard');
	});
}
