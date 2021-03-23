import * as fs from 'fs-extra';
import * as path from 'path';
import { ExecFunction } from 'makfy/dist/lib/schema/runtime';

import {
	DASHBOARD_DIR,
	METRICS_DIR,
} from '../../../collectors/shared/constants';
import { Metric, METRICS } from '../metrics';
import {
	DASHBOARD_DIST_DIR,
	DASHBOARD_EXCLUDED_FILES,
} from '../../../collectors/dashboard/lib/constants';
import { asyncGlob } from '../../../collectors/shared/helpers';
import { preserveCommandBuilder } from '../../lib/makfy-helper';
import { cmd } from 'makfy';
import { TS_NODE_COMMAND } from '../../lib/helpers';

const BROWSERS_LIST_FILE = path.join(DASHBOARD_DIR, 'browserslist');
const ANGULAR_PROJECT_FILE = path.join(DASHBOARD_DIR, 'angular.json');
const DASHBOARD_BASE_DIR = path.join(METRICS_DIR, `collectors/dashboard`);

async function getDashboardFiles(): Promise<string[]> {
	const allJsFiles = await asyncGlob('*.js', {
		cwd: DASHBOARD_DIST_DIR,
	});
	const files = allJsFiles.filter(
		(file) => !DASHBOARD_EXCLUDED_FILES.includes(file)
	);
	return files.map((file) => path.join(DASHBOARD_DIST_DIR, file));
}

async function preDashboardBuild(exec: ExecFunction) {
	await exec('? Changing browser target to speed things up');
	await fs.writeFile(BROWSERS_LIST_FILE, 'last 2 Chrome versions\n', {
		encoding: 'utf8',
	});

	await exec('? Changing output dir');
	const projectFile = JSON.parse(
		await fs.readFile(ANGULAR_PROJECT_FILE, {
			encoding: 'utf8',
		})
	);
	projectFile.projects.zensie.architect.build.options.outputPath =
		'dist/dashboard';
	await fs.writeFile(ANGULAR_PROJECT_FILE, JSON.stringify(projectFile), {
		encoding: 'utf8',
	});
}

async function postDashboardBuild(exec: ExecFunction) {
	const dashboardCtx = await exec(`cd ${DASHBOARD_DIR}`);

	await exec('? Changing browser target back');
	await dashboardCtx.keepContext(`git checkout ${BROWSERS_LIST_FILE}`);

	await exec('? Changing output dir back');
	await dashboardCtx.keepContext(`git checkout ${ANGULAR_PROJECT_FILE}`);
}

async function buildDashboard(exec: ExecFunction) {
	await preDashboardBuild(exec);

	await exec('? Building dashboard');
	await exec(`yarn --cwd ${DASHBOARD_DIR} makfy build`);

	await postDashboardBuild(exec);
}

async function dashboardPreBundleMetrics(exec: ExecFunction) {
	await buildDashboard(exec);

	await exec('? Concatenating into bundle');
	const files = await Promise.all(
		(await getDashboardFiles()).map((file) => {
			return fs.readFile(file, {
				encoding: 'utf8',
			});
		})
	);
	const bundle = files.reduce((prev, current) => {
		return `${prev}\n\n${current}`;
	});
	const concatenatedFilePath = path.join(
		DASHBOARD_DIST_DIR,
		'concatenated.js'
	);
	await fs.writeFile(concatenatedFilePath, bundle, {
		encoding: 'utf8',
	});

	await exec('? Creating index.html file');
	await fs.writeFile(
		path.join(DASHBOARD_DIST_DIR, 'index.html'),
		'<html><body><script src="bundle.js"></script></body>',
		{
			encoding: 'utf8',
		}
	);

	await exec('? Bundling');
	await exec(
		`esbuild ${concatenatedFilePath} --minify --outfile=${path.join(
			DASHBOARD_DIST_DIR,
			'bundle.js'
		)}`
	);
}

export const dashboardMetrics = preserveCommandBuilder(
	cmd('dashboard-metrics').desc('Collect dashboard metrics')
).run(async (exec) => {
	const dashboardCtx = await exec(`cd ${DASHBOARD_DIR}`);
	await dashboardCtx.keepContext('git reset --hard');

	await exec('? Preparing bundle');
	await dashboardPreBundleMetrics(exec);

	await exec('? Collecting non time sensitive metrics');
	await exec(
		[
			'structural-complexity',
			'cyclomatic-complexity',
			'lines-of-code',
			'maintainability',
			'load-time',
			'size',
			'number-of-components',
		].map((metric) => {
			return `${TS_NODE_COMMAND} ${path.join(
				DASHBOARD_BASE_DIR,
				`${metric}.ts`
			)}`;
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

	await buildDashboard(exec);

	await dashboardCtx.keepContext('git reset --hard');
});
