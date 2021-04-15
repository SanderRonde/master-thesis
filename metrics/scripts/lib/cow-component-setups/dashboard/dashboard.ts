import * as fs from 'fs-extra';
import * as path from 'path';

import { registerSetupCommand } from '../../../lib/makfy-helper';
import { cpxAsync, rimrafAsync } from '../../../lib/helpers';
import { readFile, writeFile } from '../../../../collectors/shared/files';
import { ExecFunction } from 'makfy/dist/lib/schema/runtime';
import { concatIntoBundle } from '../../cow-components-shared';
import { SUBMODULES_DIR } from '../../../../collectors/shared/constants';
import {
	collectCyclomaticComplexity,
	collectIsCSSFramework,
	collectLinesOfCode,
	collectLoadTime,
	collectMaintainability,
	CollectorArgs,
	collectSize,
	collectStructuralComplexity,
} from '../../bundles-shared';
import {
	duplicateRenderTimeKeys,
	getDashboardFileStructuralComplexity,
} from '../../../../collectors/shared/cow-components-shared';
import { createTSProgram } from '../../../../collectors/shared/typescript';
import {
	ComponentFiles,
	ReadFile,
} from '../../../../collectors/metric-definitions/types';
import { storeData } from '../../../../collectors/shared/storage';
import { RenderTime } from '../../../../collectors/shared/types';
import { getRenderTime } from '../../../../collectors/metric-definitions/render-time';
import { generateRenderTimePage } from '../../../../collectors/shared/dashboard/generate-render-time-page';

type BaseDirs = ReturnType<typeof getDashboardDirs>;

function getDashboardDirs(baseDir: string, submoduleName: string) {
	return {
		baseDir,
		distDir: path.join(baseDir, 'dist/dashboard'),
		ignoredDir: path.join(baseDir, 'tmp'),
		browsersListFile: path.join(baseDir, 'browserslist'),
		angularProjectFile: path.join(baseDir, 'angular.json'),
		submodulePath: path.join(SUBMODULES_DIR, submoduleName),
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

interface NGElement {
	__ngContext__: any[];
}

async function getDashboardRenderTime(
	components: ComponentFiles[],
	sourceRoot: string
): Promise<RenderTime> {
	return await getRenderTime({
		getComponents: () => components.map((c) => c.js.componentName),
		sourceRoot: sourceRoot,
		urlPath: '/404',
		showComponent: async (component, page) => {
			await page.$eval(
				'page-not-found',
				(element, componentName) => {
					((element as unknown) as NGElement).__ngContext__
						.find(
							(c) =>
								c &&
								typeof c === 'object' &&
								'setRenderOption' in c
						)
						.setRenderOption(componentName, true);
				},
				component
			);
		},
	});
}

async function collectDashboardRenderTimes({
	bundleCategory,
	bundleName,
	components,
	demoPath,
}: CollectorArgs) {
	await storeData(
		['metrics', bundleCategory, bundleName, 'render-time'],
		duplicateRenderTimeKeys(
			await getDashboardRenderTime(components, demoPath)
		)
	);
}

export const EXCLUDED_COMPONENTS = [
	'LineChartComponent',
	'PopupsComponent',
	'ToastNotificationComponent',
	'PopupComponent',
	'ToastComponent',
	'ThemeProviderComponent',
	'FireworksComponent',
	'ChartErrorComponent',
];

export async function getComponents(submodulePath: string) {
	type ImportType = typeof import('../../../../submodules/30mhz-dashboard/src/lib/web-components/scripts/lib/get-cow-components');
	const { getCowComponents, getMatchingComponent } = (await import(
		path.join(
			submodulePath,
			'src/lib/web-components/scripts/lib/get-cow-components'
		)
	)) as {
		getCowComponents: ImportType['getCowComponents'];
		getMatchingComponent: ImportType['getMatchingComponent'];
	};

	const componentFiles = (await getCowComponents('src')).filter(
		(c) => !EXCLUDED_COMPONENTS.includes(c.componentName)
	);

	const templateFiles = await getCowComponents('src', 'html');

	return componentFiles.map((componentFile) => {
		return {
			js: componentFile,
			html: getMatchingComponent(componentFile, templateFiles),
		};
	});
}

export function createDashboardMetricsCommand(
	commandName: string,
	baseDir: string,
	category: string,
	submoduleName: string
) {
	const dirs = getDashboardDirs(baseDir, submoduleName);

	return registerSetupCommand(commandName).run(async (exec, args) => {
		const dashboardCtx = await exec(`cd ${baseDir}`);
		await dashboardCtx.keepContext('git reset --hard');

		await exec('? Preparing bundle');
		await dashboardPreBundleMetrics(exec, dirs, args['no-cache']);

		await exec('? Collecting non time sensitive metrics');
		const components = await getComponents(dirs.submodulePath);

		const collectorArgs: CollectorArgs = {
			bundleCategory: category,
			bundleName: commandName,
			components,
			demoPath: dirs.distDir,
			basePath: '',
		};

		await collectIsCSSFramework(collectorArgs, {});

		const tsProgram = await createTSProgram(
			components.map((component) => component.js.filePath)
		);
		const structuralComplexityArgs = {
			tsProgram: tsProgram,
			baseDir: baseDir,
		};
		await collectStructuralComplexity(collectorArgs, (file: ReadFile) =>
			getDashboardFileStructuralComplexity(file, structuralComplexityArgs)
		);

		await collectCyclomaticComplexity(collectorArgs);

		await collectLinesOfCode(collectorArgs);

		await collectMaintainability(collectorArgs);

		await collectSize(collectorArgs, {
			indexJsFileName: 'bundle.js',
		});

		await collectLoadTime(collectorArgs, {
			indexJsFileName: 'bundle.js',
			urlPath: '/index.html',
		});

		await dashboardCtx.keepContext('git reset --hard');

		await exec('? Preparing for render time measuring');
		await generateRenderTimePage(baseDir, submoduleName);

		await buildDashboard(exec, dirs, 'render-time', args['no-cache']);

		await collectDashboardRenderTimes(collectorArgs);

		await dashboardCtx.keepContext('git reset --hard');
	});
}
