import * as fs from 'fs-extra';
import * as path from 'path';
import { ExecFunction } from 'makfy/dist/lib/schema/runtime';

import {
	DASHBOARD_DIR,
	METRICS_DIR,
} from '../../../../collectors/shared/constants';
import {
	DASHBOARD_DIST_DIR,
	DASHBOARD_IGNORED_DIR,
} from '../../../../collectors/cow-components/dashboard/lib/constants';
import { registerMetricsCommand } from '../../../lib/makfy-helper';
import {
	cpxAsync,
	omitArr,
	rimrafAsync,
	TS_NODE_COMMAND,
} from '../../../lib/helpers';
import { METRICS } from '../../../lib/constants';
import { readFile, writeFile } from '../../../../collectors/shared/files';
import { concatIntoBundle } from '../../../lib/cow-components-shared';

const BROWSERS_LIST_FILE = path.join(DASHBOARD_DIR, 'browserslist');
const ANGULAR_PROJECT_FILE = path.join(DASHBOARD_DIR, 'angular.json');
const DASHBOARD_BASE_DIR = path.join(
	METRICS_DIR,
	`collectors/cow-components/dashboard`
);

async function preDashboardBuild(exec: ExecFunction) {
	await exec('? Changing browser target to speed things up');
	await writeFile(BROWSERS_LIST_FILE, 'last 2 Chrome versions\n');

	await exec('? Changing output dir');
	const projectFile = JSON.parse(await readFile(ANGULAR_PROJECT_FILE));
	projectFile.projects.zensie.architect.build.options.outputPath =
		'dist/dashboard';
	await writeFile(ANGULAR_PROJECT_FILE, JSON.stringify(projectFile));
}

async function postDashboardBuild(exec: ExecFunction) {
	const dashboardCtx = await exec(`cd ${DASHBOARD_DIR}`);

	await exec('? Changing browser target back');
	await dashboardCtx.keepContext(`git checkout ${BROWSERS_LIST_FILE}`);

	await exec('? Changing output dir back');
	await dashboardCtx.keepContext(`git checkout ${ANGULAR_PROJECT_FILE}`);
}

async function buildDashboard(
	exec: ExecFunction,
	cacheDir: string,
	noCache: boolean = false
) {
	const fullCachePath = path.join(DASHBOARD_IGNORED_DIR, 'cached', cacheDir);
	if (!noCache && (await fs.pathExists(fullCachePath))) {
		await rimrafAsync(DASHBOARD_DIST_DIR);
		await fs.mkdirp(DASHBOARD_DIST_DIR);
		await cpxAsync(path.join(fullCachePath, '**'), DASHBOARD_DIST_DIR, {
			clean: true,
			includeEmptyDirs: true,
		});
		return;
	}

	await preDashboardBuild(exec);

	await exec('? Building dashboard');
	await exec(`yarn --cwd ${DASHBOARD_DIR} makfy build`);

	await postDashboardBuild(exec);

	await rimrafAsync(fullCachePath);
	await fs.mkdirp(fullCachePath);
	await cpxAsync(path.join(DASHBOARD_DIST_DIR, '**'), fullCachePath);
}

async function dashboardPreBundleMetrics(exec: ExecFunction, noCache: boolean) {
	await buildDashboard(exec, 'pre-metrics', noCache);

	await concatIntoBundle(exec, DASHBOARD_DIST_DIR);
}

export const dashboardMetrics = registerMetricsCommand('dashboard').run(
	async (exec, args) => {
		const dashboardCtx = await exec(`cd ${DASHBOARD_DIR}`);
		await dashboardCtx.keepContext('git reset --hard');

		await exec('? Preparing bundle');
		await dashboardPreBundleMetrics(exec, args['no-cache']);

		await exec('? Collecting non time sensitive metrics');
		await Promise.all(
			omitArr(METRICS, 'render-time').map((metric) => {
				return exec(
					`${TS_NODE_COMMAND} ${path.join(
						DASHBOARD_BASE_DIR,
						`${metric}.ts`
					)}`
				);
			})
		);

		await exec('? Collecting load time');
		await exec(
			`${TS_NODE_COMMAND} ${path.join(
				DASHBOARD_BASE_DIR,
				`load-time.ts`
			)}`
		);

		await dashboardCtx.keepContext('git reset --hard');

		await exec('? Preparing for render time measuring');
		await exec(
			`${TS_NODE_COMMAND} ${path.join(
				DASHBOARD_BASE_DIR,
				`lib/render-time/generate-render-time-page.ts`
			)}`
		);

		await buildDashboard(exec, 'render-time', args['no-cache']);

		await exec(
			`${TS_NODE_COMMAND} ${path.join(
				DASHBOARD_BASE_DIR,
				`render-time.ts`
			)}`
		);

		await dashboardCtx.keepContext('git reset --hard');
	}
);
