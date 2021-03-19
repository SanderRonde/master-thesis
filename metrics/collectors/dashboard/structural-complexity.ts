import * as ts from 'typescript';
import * as path from 'path';
import * as fs from 'fs-extra';

import { runFunctionIfCalledFromScript } from '../shared/helpers';
import { StructuralComplexityData } from '../shared/types';
import { storeData } from '../shared/storage';
import { ComponentFiles, getComponents, ReadFile } from './get-components';
import { createTSProgram } from '../shared/typescript';
import { DASHBOARD_DIR } from '../shared/constants';
import { STRUCTURAL_COMPLEXITY_DEPTH } from '../shared/settings';

function isAbsolute(filePath: string): boolean {
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

async function createFilePath(base: string, ends: string[]) {
	for (const end of ends) {
		if (await fs.pathExists(path.join(base, end))) {
			return path.join(base, end);
		}
	}
	return null;
}

async function recursivelyGetDependencies(
	sourceFile: ts.SourceFile,
	levelsRemaining: number,
	tsProgram: ts.Program
): Promise<string[]> {
	if (levelsRemaining === 0) return [];

	const imports: string[] = [];
	const baseUrl = tsProgram.getCompilerOptions().baseUrl;

	// Import declarations only happen at the root so that makes it a bit easier
	if (!sourceFile) {
		debugger;
	}
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
				joinedPath = await createFilePath(
					path.join(DASHBOARD_DIR, baseUrl),
					[
						`${importPath.text}/index.ts`,
						`${importPath.text}.ts`,
						`${importPath.text}`,
					]
				);
				if (!joinedPath) {
					imports.push(importPath.text);
					continue;
				}
			} else {
				joinedPath = await createFilePath(
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
					console.warn(`Skipping ${joinedPath}`);
					continue;
				}
			}
			imports.push(path.resolve(joinedPath));

			imports.push(
				...(await recursivelyGetDependencies(
					await getSourceFile(tsProgram, joinedPath)!,
					levelsRemaining - 1,
					tsProgram
				))
			);
		}
	}

	return imports;
}

async function getFileDependencies(
	component: ReadFile,
	maxLevel: number,
	tsProgram: ts.Program
): Promise<string[]> {
	const sourceFile = tsProgram.getSourceFile(component.filePath);
	if (!sourceFile) {
		throw new Error('Failed to find component TS source file');
	}

	return await recursivelyGetDependencies(sourceFile, maxLevel, tsProgram);
}

async function getComponentStructuralComplexity(
	component: ComponentFiles,
	tsProgram: ts.Program
): Promise<number> {
	const dependencies = [
		...(await getFileDependencies(
			component.js,
			STRUCTURAL_COMPLEXITY_DEPTH,
			tsProgram
		)),
		// HTML template files don't have dependencies in this
		// project
	];

	return dependencies.filter(
		(dependency, index, arr) => arr.indexOf(dependency) === index
	).length;
}

export async function getStructuralComplexity(): Promise<StructuralComplexityData> {
	const components = await getComponents();
	const tsProgram = await createTSProgram(
		components.map((component) => component.js.filePath)
	);

	const structuralDependencyData: StructuralComplexityData = {};
	await Promise.all(
		components.map(async (component) => {
			structuralDependencyData[
				component.js.componentName
			] = await getComponentStructuralComplexity(component, tsProgram);
		})
	);

	return structuralDependencyData;
}

runFunctionIfCalledFromScript(async () => {
	const structuralComplexictyData = await getStructuralComplexity();
	console.log(structuralComplexictyData);
	await storeData(
		['metrics', 'dashboard', 'structural-complexity'],
		structuralComplexictyData
	);
}, __filename);
