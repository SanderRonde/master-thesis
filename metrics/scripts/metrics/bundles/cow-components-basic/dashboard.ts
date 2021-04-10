import * as fs from 'fs-extra';
import * as path from 'path';
import { ExecFunction } from 'makfy/dist/lib/schema/runtime';

import {
	BASIC_DASHBOARD_DIR,
	METRICS_DIR,
} from '../../../../collectors/shared/constants';
import {
	DASHBOARD_DIST_DIR,
	ANGULAR_EXCLUDED_FILES,
	DASHBOARD_IGNORED_DIR,
} from '../../../../collectors/cow-components-basic/dashboard/lib/constants';
import { asyncGlob } from '../../../../collectors/shared/helpers';
import { registerMetricsCommand } from '../../../lib/makfy-helper';
import {
	cpxAsync,
	omitArr,
	rimrafAsync,
	TS_NODE_COMMAND,
} from '../../../lib/helpers';
import { METRICS } from '../../../lib/constants';
import { readFile, writeFile } from '../../../../collectors/shared/files';
import { htmlTemplate } from '../../../../collectors/shared/templates';

const BROWSERS_LIST_FILE = path.join(BASIC_DASHBOARD_DIR, 'browserslist');
const ANGULAR_PROJECT_FILE = path.join(BASIC_DASHBOARD_DIR, 'angular.json');
const DASHBOARD_BASE_DIR = path.join(
	METRICS_DIR,
	`collectors/cow-components-basic/dashboard`
);

async function getAngularJsFilesInDir(dir: string): Promise<string[]> {
	const allJsFiles = await asyncGlob('*.js', {
		cwd: dir,
	});
	const files = allJsFiles.filter(
		(file) => !ANGULAR_EXCLUDED_FILES.includes(file)
	);
	return files.map((file) => path.join(dir, file));
}

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
	const dashboardCtx = await exec(`cd ${BASIC_DASHBOARD_DIR}`);

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
	await exec(`yarn --cwd ${BASIC_DASHBOARD_DIR} makfy build`);

	await postDashboardBuild(exec);

	await rimrafAsync(fullCachePath);
	await fs.mkdirp(fullCachePath);
	await cpxAsync(path.join(DASHBOARD_DIST_DIR, '**'), fullCachePath);
}

export async function concatIntoBundle(exec: ExecFunction, dir: string) {
	await exec('? Concatenating into bundle');
	const files = await Promise.all(
		(await getAngularJsFilesInDir(dir)).map((file) => {
			return readFile(file);
		})
	);
	const bundle = files.reduce((prev, current) => {
		return `${prev}\n\n${current}`;
	});
	const concatenatedFilePath = path.join(dir, 'concatenated.js');
	await writeFile(concatenatedFilePath, bundle);

	await exec('? Creating index.html file');
	await writeFile(
		path.join(dir, 'index.html'),
		htmlTemplate({ jsPath: 'bundle.js' })
	);

	await exec('? Bundling');
	try {
		await fs.unlink(path.join(dir, 'bundle.js'));
	} catch (e) {}
	await exec(
		`esbuild ${concatenatedFilePath} --bundle --minify --outfile=${path.join(
			dir,
			'bundle.js'
		)}`
	);
}

async function dashboardPreBundleMetrics(exec: ExecFunction, noCache: boolean) {
	await buildDashboard(exec, 'pre-metrics', noCache);

	await concatIntoBundle(exec, DASHBOARD_DIST_DIR);
}

export const dashboardMetrics = registerMetricsCommand('dashboard-basic').run(
	async (exec, args) => {
		const dashboardCtx = await exec(`cd ${BASIC_DASHBOARD_DIR}`);
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

		await dashboardCtx.keepContext('git reset --hard');

		await exec('? Preparing for load time measuring');
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