import * as path from 'path';
import * as fs from 'fs-extra';

import {
	COLLECTORS_DIR,
	SUBMODULES_DIR,
} from '../../collectors/shared/constants';
import {
	ComponentVisibilitySetterWindow,
	GetComponentModule,
} from '../../collectors/shared/shapes';
import { storeData } from '../../collectors/shared/storage';
import { createSingleFileTSProgram } from '../../collectors/shared/typescript';

import {
	registerInstallCommand,
	registerMetricsCommand,
	registerSetupCommand,
} from './makfy-helper';
import { getLoadTimeForDir } from '../../collectors/metric-definitions/load-time';
import { getRenderTime } from '../../collectors/metric-definitions/render-time';
import { STRUCTURAL_COMPLEXITY_DEPTH } from '../../collectors/shared/settings';
import ts from 'typescript';
import { readFile } from '../../collectors/shared/files';
import { createComponentFileFromSvelte } from '../../collectors/svelte/shared/util';
import { CommandBuilderWithName } from './types';
import { getFileCyclomaticComplexity } from '../../collectors/metric-definitions/cyclomatic-complexity';
import {
	ComponentFiles,
	ReadFile,
} from '../../collectors/metric-definitions/types';
import { getFileLinesOfCode } from '../../collectors/metric-definitions/lines-of-code';
import { getFileMaintainability } from '../../collectors/metric-definitions/maintainability';
import {
	collectBundleMetrics as iterateOverBundle,
	duplicateRenderTimeKeys,
	findFilePath,
	isAbsolute,
} from '../../collectors/shared/cow-components-shared';

export interface CollectorArgs {
	bundleCategory: string;
	bundleName: string;
	components: ComponentFiles[];
	demoPath: string;
	basePath: string;
	extraLevels: number;
}

declare const window: ComponentVisibilitySetterWindow;

const EXTENSIONS = [
	'/index.ts',
	'/index.js',
	'.svelte',
	'.tsx',
	'.jsx',
	'.js',
	'.ts',
	'.vue',
	'.d.ts',
	'',
];

async function getFileScript(filePath: string) {
	const extension = path.parse(filePath).ext;
	switch (extension) {
		case '.ts':
		case '.js':
		case '.tsx':
		case '.jsx':
			return await readFile(filePath);
		case '.svelte':
		case '.vue':
			const code = await readFile(filePath);
			return createComponentFileFromSvelte(code, '', filePath).js.content;
		case '.svg':
		case '.sass':
		case '.d.ts':
			return '';
		default:
			throw new Error(
				`Unknown file extension "${extension}" for file "${filePath}"`
			);
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
			} else if (importPath.text.endsWith('.css.js')) {
				continue;
			} else {
				joinedPath = await findFilePath(path.dirname(filePath), [
					...EXTENSIONS.map((ext) => `${importPath.text}${ext}`),
					...EXTENSIONS.map(
						(ext) =>
							`${(() => {
								const parsed = path.parse(importPath.text);
								return path.join(parsed.dir, parsed.name);
							})()}${ext}`
					),
				]);
				if (!joinedPath) {
					throw new Error(
						`Failed to find path for "${path.dirname(filePath)}"."${
							importPath.text
						}"`
					);
				}
			}
			imports.push(path.resolve(joinedPath));

			const script = await getFileScript(joinedPath);
			if (script.length !== 0) {
				imports.push(
					...(await recursivelyGetDependencies(
						(await createSingleFileTSProgram(script)).ast,
						joinedPath,
						levelsRemaining - 1
					))
				);
			}
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

async function getFileStructuralComplexity(
	file: ReadFile,
	args: { extraLevels: number }
): Promise<number> {
	const dependencies = await getFileDependencies(
		file,
		STRUCTURAL_COMPLEXITY_DEPTH + args.extraLevels
	);

	return dependencies.filter(
		(dependency, index, arr) => arr.indexOf(dependency) === index
	).length;
}

export async function collectStructuralComplexity(
	{ bundleCategory, bundleName, components, extraLevels }: CollectorArgs,
	overrides: BundleMetricsOverrides
) {
	const getComplexityFunction = overrides.createComplexityFunction
		? await overrides.createComplexityFunction?.(components)
		: getFileStructuralComplexity;
	const metrics = await iterateOverBundle(
		components,
		getComplexityFunction,
		() => ({
			extraLevels,
		})
	);

	await storeData(
		['metrics', bundleCategory, bundleName, 'structural-complexity'],
		metrics
	);
}

export async function collectCyclomaticComplexity({
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

export async function collectLinesOfCode({
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

export async function collectMaintainability({
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

export async function collectSize(
	{ bundleCategory, bundleName, demoPath, basePath }: CollectorArgs,
	overrides: BundleMetricsOverrides
) {
	const size = (
		await fs.stat(
			path.join(
				overrides.demoDir?.(basePath) || demoPath,
				overrides.indexJsFileName || 'demo.bundle.js'
			)
		)
	).size;

	await storeData(['metrics', bundleCategory, bundleName, 'size'], size);
}

export async function collectLoadTime(
	{ bundleCategory, bundleName, demoPath, basePath }: CollectorArgs,
	overrides: BundleMetricsOverrides
) {
	const loadTime = await getLoadTimeForDir(
		overrides.demoDir?.(basePath) || demoPath,
		overrides.indexJsFileName || 'demo.bundle.js',
		overrides.urlPath || '/demo.html'
	);

	await storeData(
		['metrics', bundleCategory, bundleName, 'load-time'],
		loadTime
	);
}

export async function collectIsCSSFramework(
	{ bundleCategory, bundleName }: CollectorArgs,
	overrides: BundleMetricsOverrides
) {
	await storeData(
		['metrics', bundleCategory, bundleName, 'is-css-framework'],
		overrides.isCSSFramework || false
	);
}

export async function collectRenderTimes(
	{ bundleCategory, bundleName, demoPath, basePath }: CollectorArgs,
	overrides: BundleMetricsOverrides
) {
	const renderTimes = await getRenderTime({
		getComponents: async (page) => {
			const visibleComponentNames = await page.evaluate(() => {
				return window.availableComponents;
			});
			return visibleComponentNames;
		},
		sourceRoot:
			overrides.renderTimeDemoDir?.(basePath) ||
			overrides.demoDir?.(basePath) ||
			demoPath,
		urlPath: overrides.urlPath || '/demo.html',
		showComponent: async (component, numberOfComponents, page) => {
			await page.evaluate(
				(componentName, numberOfComponents) => {
					window.setVisibleComponent(
						componentName,
						numberOfComponents,
						true
					);
				},
				component,
				numberOfComponents
			);
		},
	});

	await storeData(
		['metrics', bundleCategory, bundleName, 'render-time'],
		duplicateRenderTimeKeys(renderTimes)
	);
}

export function getSharedBundlePaths(
	bundleCategory: string,
	bundleName: string,
	overrides: BundleMetricsOverrides
) {
	const basePath = path.join(COLLECTORS_DIR, bundleCategory, bundleName);
	const demoPath =
		overrides.demoDir?.(basePath) || path.join(basePath, 'demo');
	const submodulePath = path.join(
		SUBMODULES_DIR,
		overrides.submoduleName || bundleName
	);
	return {
		basePath,
		demoPath,
		submodulePath,
	};
}

export function getBundleInstallCommand<N extends string>(
	bundleCategory: string,
	bundleName: N,
	overrides: BundleMetricsOverrides = {}
): CommandBuilderWithName<N> {
	const { demoPath } = getSharedBundlePaths(
		bundleCategory,
		bundleName,
		overrides
	);

	const installCommand = registerInstallCommand(bundleName).run(
		async (exec) => {
			await exec('? Installing dependencies');
			await exec(
				`yarn --cwd ${demoPath} || yarn --cwd ${demoPath} || yarn --cwd ${demoPath}`
			);
		}
	);

	return installCommand as CommandBuilderWithName<N>;
}

export function getBundleSetupCommand<N extends string>(
	bundleCategory: string,
	bundleName: N
): CommandBuilderWithName<N> {
	const { demoPath } = getSharedBundlePaths(bundleCategory, bundleName, {});

	const setupCommand = registerSetupCommand(bundleName).run(async (exec) => {
		await exec('? Building');
		await exec(`yarn --cwd ${demoPath} build`);
	});

	return setupCommand as CommandBuilderWithName<N>;
}

export interface BundleMetricsOverrides {
	indexJsFileName?: string;
	demoDir?: (basePath: string) => string;
	renderTimeDemoDir?: (basePath: string) => string;
	urlPath?: string;
	submoduleName?: string;
	isCSSFramework?: boolean;
	getComponents?: () => Promise<ComponentFiles[]>;
	createComplexityFunction?: (
		components: ComponentFiles[]
	) => Promise<
		(file: ReadFile, args: { extraLevels: number }) => Promise<number>
	>;
}

export function getBundleMetricsCommand<N extends string>(
	bundleCategory: string,
	bundleName: N,
	overrides: BundleMetricsOverrides = {}
): CommandBuilderWithName<N> {
	const { basePath, demoPath, submodulePath } = getSharedBundlePaths(
		bundleCategory,
		bundleName,
		overrides
	);

	const metricsCommand = registerMetricsCommand(bundleName).run(
		async (exec, args) => {
			await exec('? Collecting source-file-based metrics');
			const { components, extraLevels } = await (async () => {
				if (overrides.getComponents) {
					return {
						components: await overrides.getComponents(),
						extraLevels: 0,
					};
				}

				const { getComponents } = (await import(
					path.join(basePath, 'get-components.ts')
				)) as GetComponentModule;

				const result = await getComponents(submodulePath);
				if (Array.isArray(result)) {
					return {
						extraLevels: 0,
						components: result,
					};
				} else {
					return result;
				}
			})();

			const collectorArgs: CollectorArgs = {
				bundleCategory,
				bundleName,
				components,
				demoPath,
				basePath,
				extraLevels,
			};
			await exec('? Collecting CSS framework status');
			await collectIsCSSFramework(collectorArgs, overrides);

			await exec('? Collecting structural complexity');
			await collectStructuralComplexity(collectorArgs, overrides);

			await exec('? Collecting cyclomatic complexity');
			await collectCyclomaticComplexity(collectorArgs);

			await exec('? Collecting lines of code');
			await collectLinesOfCode(collectorArgs);

			await exec('? Collecting maintainability');
			await collectMaintainability(collectorArgs);

			await exec('? Collecting size');
			await collectSize(collectorArgs, overrides);

			if (!args['multi-run']) {
				await exec('? Collecting load time');
				await collectLoadTime(collectorArgs, overrides);

				await exec('? Collecting render times');
				await collectRenderTimes(collectorArgs, overrides);
			}
		}
	);

	return metricsCommand as CommandBuilderWithName<N>;
}

export function getBundleInstallCommandCreator(
	bundleCategory: string,
	creatorOverrides: BundleMetricsOverrides = {}
) {
	return <N extends string>(
		bundleName: N,
		overrides: BundleMetricsOverrides = {}
	) => {
		return getBundleInstallCommand(bundleCategory, bundleName, {
			...creatorOverrides,
			...overrides,
		});
	};
}

export function getBundleSetupCommandCreator(bundleCategory: string) {
	return <N extends string>(bundleName: N) => {
		return getBundleSetupCommand(bundleCategory, bundleName);
	};
}

export function getBundleMetricsCommandCreator(
	bundleCategory: string,
	creatorOverrides?: BundleMetricsOverrides
) {
	return <N extends string>(
		bundleName: N,
		overrides?: BundleMetricsOverrides
	) => {
		return getBundleMetricsCommand(bundleCategory, bundleName, {
			...creatorOverrides,
			...overrides,
		});
	};
}
