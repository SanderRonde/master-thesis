import * as path from 'path';
import * as fs from 'fs-extra';

import { getFileCyclomaticComplexity } from '../../collectors/cow-components/dashboard/cyclomatic-complexity';
import {
	ComponentFiles,
	ReadFile,
} from '../../collectors/cow-components/dashboard/lib/get-components';
import { collectBundleMetrics as iterateOverBundle } from '../../collectors/cow-components/dashboard/lib/shared';
import { getFileLinesOfCode } from '../../collectors/cow-components/dashboard/lines-of-code';
import { getFileMaintainability } from '../../collectors/cow-components/dashboard/maintainability';
import {
	findFilePath,
	isAbsolute,
} from '../../collectors/cow-components/dashboard/structural-complexity';
import {
	COLLECTORS_DIR,
	SUBMODULES_DIR,
} from '../../collectors/shared/constants';
import {
	ComponentVisibilitySetterWindow,
	GetComponentModule,
} from '../../collectors/shared/shapes';
import { storeData } from '../../collectors/shared/storage';
import {
	createSingleFileTSProgram,
	createTSProgram,
} from '../../collectors/shared/typescript';

import { registerMetricsCommand, registerSetupCommand } from './makfy-helper';
import { getLoadTimeForDir } from '../../collectors/shared/load-time';
import { getRenderTime } from '../../collectors/shared/render-time';
import { STRUCTURAL_COMPLEXITY_DEPTH } from '../../collectors/shared/settings';
import ts from 'typescript';
import { readFile } from '../../collectors/shared/files';
import { createComponentFileFromSvelte } from '../../collectors/svelte/shared/util';

interface CollectorArgs {
	bundleCategory: string;
	bundleName: string;
	components: ComponentFiles[];
	demoPath: string;
}

declare const window: ComponentVisibilitySetterWindow;

const EXTENSIONS = ['/index.ts', '.svelte', '.tsx', '.jsx', '.js', '.ts', ''];

async function getFileScript(filePath: string) {
	const extension = path.parse(filePath).ext;
	switch (extension) {
		case '.ts':
		case '.js':
		case '.tsx':
		case '.jsx':
			return await readFile(filePath);
		case '.svelte':
			const code = await readFile(filePath);
			return createComponentFileFromSvelte(code, '', filePath).js.content;
		default:
			throw new Error('Unknown file extension');
	}
}

async function recursivelyGetDependencies(
	sourceFile: ts.SourceFile,
	filePath: string,
	levelsRemaining: number
): Promise<string[]> {
	if (levelsRemaining === 0) return [];

	const imports: string[] = [];

	// Import declarations only happen at the root so that makes it a bit easier
	for (const statement of sourceFile.statements) {
		if (ts.isImportDeclaration(statement)) {
			const importPath = statement.moduleSpecifier;
			if (!ts.isStringLiteral(importPath)) {
				throw new Error('Found an unknown import type');
			}

			let joinedPath;
			if (isAbsolute(importPath.text)) {
				// If it's an import of an NPM package, skip it
				continue;
			} else {
				joinedPath = await findFilePath(
					path.dirname(filePath),
					EXTENSIONS.map((ext) => `${importPath.text}${ext}`)
				);
				if (!joinedPath) {
					console.log(filePath, importPath.text);
					throw new Error(
						`Failed to find path for "${path.dirname(filePath)}"."${
							importPath.text
						}"`
					);
				}
			}
			imports.push(path.resolve(joinedPath));

			imports.push(
				...(await recursivelyGetDependencies(
					(
						await createSingleFileTSProgram(
							await getFileScript(joinedPath)
						)
					).ast,
					joinedPath,
					levelsRemaining - 1
				))
			);
		}
	}

	return imports;
}

async function getFileDependencies(
	file: ReadFile,
	maxDepth: number
): Promise<string[]> {
	const tsFile = (await createSingleFileTSProgram(file.content)).ast;
	return await recursivelyGetDependencies(tsFile, file.filePath, maxDepth);
}

async function getFileStructuralComplexity(file: ReadFile): Promise<number> {
	const dependencies = await getFileDependencies(
		file,
		STRUCTURAL_COMPLEXITY_DEPTH
	);

	return dependencies.filter(
		(dependency, index, arr) => arr.indexOf(dependency) === index
	).length;
}

async function collectStructuralComplexity({
	bundleCategory,
	bundleName,
	components,
}: CollectorArgs) {
	const metrics = await iterateOverBundle(
		components,
		getFileStructuralComplexity
	);

	await storeData(
		['metrics', bundleCategory, bundleName, 'structural-complexity'],
		metrics
	);
}

async function collectCyclomaticComplexity({
	bundleCategory,
	bundleName,
	components,
}: CollectorArgs) {
	const metrics = await iterateOverBundle(
		components,
		getFileCyclomaticComplexity
	);

	await storeData(
		['metrics', bundleCategory, bundleName, 'cyclomatic-complexity'],
		metrics
	);
}

async function collectLinesOfCode({
	bundleCategory,
	bundleName,
	components,
}: CollectorArgs) {
	const metrics = await iterateOverBundle(components, getFileLinesOfCode);

	await storeData(
		['metrics', bundleCategory, bundleName, 'lines-of-code'],
		metrics
	);
}

async function collectMaintainability({
	bundleCategory,
	bundleName,
	components,
}: CollectorArgs) {
	const metrics = await iterateOverBundle(components, getFileMaintainability);

	await storeData(
		['metrics', bundleCategory, bundleName, 'maintainability'],
		metrics
	);
}

async function collectSize({
	bundleCategory,
	bundleName,
	demoPath,
}: CollectorArgs) {
	const size = (await fs.stat(path.join(demoPath, 'demo.bundle.js'))).size;

	await storeData(['metrics', bundleCategory, bundleName, 'size'], size);
}

async function collectLoadTime({
	bundleCategory,
	bundleName,
	demoPath,
}: CollectorArgs) {
	const loadTime = await getLoadTimeForDir(
		demoPath,
		'demo.bundle.js',
		'/demo.html'
	);

	await storeData(
		['metrics', bundleCategory, bundleName, 'load-time'],
		loadTime
	);
}

async function collectRenderTimes({
	bundleCategory,
	bundleName,
	demoPath,
}: CollectorArgs) {
	const renderTimes = await getRenderTime({
		getComponents: async (page) => {
			const visibleComponentNames = await page.evaluate(() => {
				return window.avilableComponents;
			});
			return visibleComponentNames;
		},
		sourceRoot: demoPath,
		urlPath: '/demo.html',
		showComponent: async (component, page) => {
			await page.evaluate((componentName) => {
				window.setVisibleComponent(componentName, true);
			}, component);
		},
		hideComponent: async (component, page) => {
			await page.evaluate((componentName) => {
				window.setVisibleComponent(componentName, false);
			}, component);
		},
	});

	await storeData(
		['metrics', bundleCategory, bundleName, 'render-time'],
		renderTimes
	);
}

export function collectBundleMetrics(
	bundleCategory: string,
	bundleName: string
) {
	const basePath = path.join(COLLECTORS_DIR, bundleCategory, bundleName);
	const demoPath = path.join(basePath, 'demo');
	const submodulePath = path.join(SUBMODULES_DIR, bundleName);

	const setupCommand = registerSetupCommand(bundleName).run(async (exec) => {
		await exec('? Installing dependencies');
		await exec(`yarn --cwd ${demoPath}`);

		await exec('? Building');
		await exec(`yarn --cwd ${demoPath} build`);
	});

	const metricsCommand = registerMetricsCommand(bundleName).run(
		async (exec) => {
			await exec('? Collecting source-file-based metrics');
			const { getComponents } = (await import(
				path.join(basePath, 'get-components.ts')
			)) as GetComponentModule;

			const components = await getComponents(submodulePath);
			const collectorArgs: CollectorArgs = {
				bundleCategory,
				bundleName,
				components,
				demoPath,
			};
			await exec('? Collecting structural complexity');
			await collectStructuralComplexity(collectorArgs);

			await exec('? Collecting cyclomatic complexity');
			await collectCyclomaticComplexity(collectorArgs);

			await exec('? Collecting lines of code');
			await collectLinesOfCode(collectorArgs);

			await exec('? Collecting maintainability');
			await collectMaintainability(collectorArgs);

			await exec('? Collecting size');
			await collectSize(collectorArgs);

			await exec('? Collecting load time');
			await collectLoadTime(collectorArgs);

			await exec('? Collecting render times');
			await collectRenderTimes(collectorArgs);
		}
	);

	return {
		setupCommand,
		metricsCommand,
	};
}
