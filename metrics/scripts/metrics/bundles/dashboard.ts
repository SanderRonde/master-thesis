import * as fs from 'fs-extra';
import * as path from 'path';
import { ExecFunction } from 'makfy/dist/lib/schema/runtime';

import { DASHBOARD_DIR } from '../../../collectors/shared/constants';
import { Metric } from '../metrics';
import {
	DASHBOARD_DIST_DIR,
	DASHBOARD_EXCLUDED_FILES,
} from '../../../collectors/dashboard/lib/constants';
import { asyncGlob } from '../../../collectors/shared/helpers';

const BROWSERS_LIST_FILE = path.join(DASHBOARD_DIR, 'browserslist');
const ANGULAR_PROJECT_FILE = path.join(DASHBOARD_DIR, 'angular.json');

interface TempDashboardFiles {
	oldBrowsersList: string;
	oldProjectFile: string;
}

async function getDashboardFiles(): Promise<string[]> {
	const allJsFiles = await asyncGlob('*.js', {
		cwd: DASHBOARD_DIST_DIR,
	});
	const files = allJsFiles.filter(
		(file) => !DASHBOARD_EXCLUDED_FILES.includes(file)
	);
	return files.map((file) => path.join(DASHBOARD_DIST_DIR, file));
}

async function preDashboardBuild(
	exec: ExecFunction
): Promise<TempDashboardFiles> {
	await exec('? Changing browser target to speed things up');
	const oldBrowsersList = await fs.readFile(BROWSERS_LIST_FILE, {
		encoding: 'utf8',
	});
	await fs.writeFile(BROWSERS_LIST_FILE, 'last 2 Chrome versions\n', {
		encoding: 'utf8',
	});

	await exec('? Changing output dir');
	const oldProjectFile = await fs.readFile(ANGULAR_PROJECT_FILE, {
		encoding: 'utf8',
	});
	const projectFile = JSON.parse(oldProjectFile);
	projectFile.projects.zensie.architect.build.options.outputPath =
		'dist/dashboard';
	await fs.writeFile(ANGULAR_PROJECT_FILE, JSON.stringify(projectFile), {
		encoding: 'utf8',
	});

	return {
		oldBrowsersList,
		oldProjectFile,
	};
}

async function postDashboardBuild(
	exec: ExecFunction,
	files: TempDashboardFiles
) {
	await exec('? Changing browser target back');
	await fs.writeFile(BROWSERS_LIST_FILE, files.oldBrowsersList, {
		encoding: 'utf8',
	});

	await exec('? Changing output dir back');
	await fs.writeFile(ANGULAR_PROJECT_FILE, files.oldProjectFile, {
		encoding: 'utf8',
	});
}

export async function dashboardPreMetrics(
	exec: ExecFunction,
	metrics: Metric[]
) {
	if (
		// metrics.includes('render-time') ||
		(metrics.includes('size') || metrics.includes('load-time')) &&
		!(await fs.pathExists(DASHBOARD_DIST_DIR))
	) {
		const preBuildFiles = await preDashboardBuild(exec);

		await exec('? Building dashboard');
		await exec(`yarn --cwd ${DASHBOARD_DIR} makfy build`);

		await postDashboardBuild(exec, preBuildFiles);

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
}
