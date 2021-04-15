import * as ts from 'typescript';
import * as path from 'path';
import * as fs from 'fs-extra';
import { createTSProgram } from './typescript';
import { ComponentFiles, ReadFile } from '../metric-definitions/types';
import { STRUCTURAL_COMPLEXITY_DEPTH } from './settings';
import { BASE_COMPONENT } from './shapes';
import { DatasetStats, getDatasetStats } from './stats';
import { sortObjectKeys } from './helpers';
import { RenderTime } from './types';

export function isAbsolute(filePath: string): boolean {
	return path.isAbsolute(filePath) || !filePath.startsWith('.');
}

async function getSourceFile(
	tsProgram: ts.Program,
	filePath: string
): Promise<ts.SourceFile> {
	if (tsProgram.getSourceFile(filePath)) {
		return tsProgram.getSourceFile(filePath)!;
	}

	return (await createTSProgram([filePath])).getSourceFile(filePath)!;
}

export async function findFilePath(base: string, ends: string[]) {
	for (const end of ends) {
		const foundPath = path.join(base, end);
		if (
			(await fs.pathExists(foundPath)) &&
			!(await fs.stat(foundPath)).isDirectory()
		) {
			return foundPath;
		}
	}
	return null;
}

async function recursivelyGetDependencies(
	sourceFile: ts.SourceFile,
	levelsRemaining: number,
	tsProgram: ts.Program,
	baseDir: string
): Promise<string[]> {
	if (levelsRemaining === 0) return [];

	const imports: string[] = [];
	const baseUrl = tsProgram.getCompilerOptions().baseUrl;

	// Import declarations only happen at the root so that makes it a bit easier
	for (const statement of sourceFile.statements) {
		if (ts.isImportDeclaration(statement)) {
			const importPath = statement.moduleSpecifier;
			if (!ts.isStringLiteral(importPath)) {
				throw new Error('Found an unknown import type');
			}

			let joinedPath;
			if (isAbsolute(importPath.text)) {
				// Sometimes absolute paths are imported even
				// though it's a file in the project. We test if
				// a file of the form `baseURL+importPath.text` exists
				// and if it does not, we assume it's a node module
				if (!baseUrl) {
					imports.push(importPath.text);
					continue;
				}
				joinedPath = await findFilePath(path.join(baseDir, baseUrl), [
					`${importPath.text}/index.ts`,
					`${importPath.text}.ts`,
					`${importPath.text}`,
				]);
				if (!joinedPath) {
					imports.push(importPath.text);
					continue;
				}
			} else {
				joinedPath = await findFilePath(
					path.dirname(sourceFile.fileName),
					[
						`${importPath.text}/index.ts`,
						`${importPath.text}.ts`,
						`${importPath.text}`,
					]
				);
				if (!joinedPath) {
					throw new Error(
						`Failed to find path for "${path.dirname(
							sourceFile.fileName
						)}"."${importPath.text}"`
					);
				}
				if (path.extname(joinedPath) !== '.ts') {
					// Can't find or open it, we skip this
					continue;
				}
			}
			imports.push(path.resolve(joinedPath));

			imports.push(
				...(await recursivelyGetDependencies(
					await getSourceFile(tsProgram, joinedPath)!,
					levelsRemaining - 1,
					tsProgram,
					baseDir
				))
			);
		}
	}

	return imports;
}

async function getFileDependencies(
	component: ReadFile,
	maxLevel: number,
	tsProgram: ts.Program,
	baseDir: string
): Promise<string[]> {
	const sourceFile = tsProgram.getSourceFile(component.filePath);
	if (!sourceFile) {
		throw new Error('Failed to find component TS source file');
	}

	return await recursivelyGetDependencies(
		sourceFile,
		maxLevel,
		tsProgram,
		baseDir
	);
}

export async function getDashboardFileStructuralComplexity(
	file: ReadFile,
	args: {
		tsProgram: ts.Program;
		baseDir: string;
	}
): Promise<number> {
	const dependencies = await getFileDependencies(
		file,
		STRUCTURAL_COMPLEXITY_DEPTH,
		args.tsProgram,
		args.baseDir
	);

	return dependencies.filter(
		(dependency, index, arr) => arr.indexOf(dependency) === index
	).length;
}

/**
 * Add copies of the dashboard's equivalents of the
 * primary button, input and switch
 * components. This is basically just a rename
 * and allows us to just do `components.Button`
 * instead of `components.Button || components.PrimaryButtonComponent`
 */
export const COMPONENT_NAME_MAP = new Map<string, string>([
	['PrimaryButtonComponent', BASE_COMPONENT.BUTTON],
	['InputElement', BASE_COMPONENT.INPUT],
	['SwitchComponent', BASE_COMPONENT.SWITCH],
]);

export async function collectBundleMetrics<A>(
	components: ComponentFiles[],
	getFileMetrics: (file: ReadFile, args: A) => number | Promise<number>,
	getArgs?: (components: ComponentFiles[]) => A | Promise<A>
): Promise<{
	components: Record<string, number>;
	stats: DatasetStats;
}> {
	const args = (await getArgs?.(components)) || ({} as A);

	const data: Record<string, number> = {};
	await Promise.all(
		components.map(async (component) => {
			const metrics = await getFileMetrics(component.js, args);
			data[component.js.componentName] = metrics;
			if (COMPONENT_NAME_MAP.has(component.js.componentName)) {
				data[
					COMPONENT_NAME_MAP.get(component.js.componentName)!
				] = metrics;
			}
		})
	);

	const stats = getDatasetStats(Object.values(data));
	return {
		components: sortObjectKeys(data),
		stats,
	};
}

export function duplicateRenderTimeKeys(renderTime: RenderTime): RenderTime {
	const added: Partial<RenderTime['components']> = {};
	for (const componentName in renderTime.components) {
		if (COMPONENT_NAME_MAP.has(componentName)) {
			added[COMPONENT_NAME_MAP.get(componentName) as any] =
				renderTime.components[componentName];
		}
	}
	return {
		stats: renderTime.stats,
		components: {
			...renderTime.components,
			...(added as RenderTime['components']),
		},
	};
}
