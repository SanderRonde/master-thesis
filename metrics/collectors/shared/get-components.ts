import * as path from 'path';
import * as fs from 'fs-extra';
import * as ts from 'typescript';
import { asyncFilter } from './helpers';
import { ComponentFiles } from '../metric-definitions/types';
import { GetComponentFunction } from './shapes';
import { readFile } from './files';
import { createSingleFileTSProgram } from './typescript';

interface ComponentGetterSettings {
	packagesPath: string;
	filters: {
		dirOnly?: boolean;
		fileOnly?: boolean;
		ignored?: (string | RegExp)[];
	};
	componentName: 'sameAsDir' | 'fromFile';
	fileName: {
		caseInSensitive?: boolean;
		initialFileStrategy:
			| {
					type: 'fileName';
					fileName: string;
			  }
			| {
					type: 'custom';
					getFile: (dirName: string) => string;
			  };
		specificFileStrategy?:
			| {
					type: 'importEndsWith';
					endsWith: string;
			  }
			| {
					type: 'matches';
					matches: RegExp[];
			  };
		overrides?: {
			[key: string]: string;
		};
	};
}

const SCRIPT_REGEX = /<script(?:.*?)>((.|\s)*?)<\/script>/g;
function splitSvelteIntoParts(
	svelteCode: string
): {
	html: string;
	js: string;
} {
	const scripts: string[] = [];

	for (
		let match = SCRIPT_REGEX.exec(svelteCode);
		match;
		match = SCRIPT_REGEX.exec(svelteCode)
	) {
		svelteCode =
			svelteCode.slice(0, match.index) +
			svelteCode.slice(match.index + match[0].length);

		scripts.push(match[1]);
	}

	return {
		html: svelteCode,
		js: scripts.join('\n'),
	};
}

function trimImport(importName: string) {
	if (importName.startsWith("'") || importName.startsWith('"')) {
		return importName.slice(1, -1);
	}
	return importName;
}

async function getImportPaths(initialFile: string) {
	const fileContent = await readFile(initialFile);
	const tsProgram = await createSingleFileTSProgram(fileContent);
	const imports = tsProgram.ast.statements.filter(
		(statement) =>
			ts.isImportDeclaration(statement) &&
			ts.isStringLiteral(statement.moduleSpecifier)
	) as ts.ImportDeclaration[];

	return imports.map((statement) =>
		trimImport(statement.moduleSpecifier.getText())
	);
}

async function findCaseInsensitiveFile(
	dirName: string,
	fileName: string
): Promise<string> {
	const dirFiles = await fs.readdir(dirName);
	for (const dirFile of dirFiles) {
		if (dirFile.toLowerCase() === fileName.toLowerCase()) {
			return dirFile;
		}
	}
	throw new Error(
		`Failed to find case insensitive file for "${dirName}"."${fileName}"`
	);
}

async function getFileName(
	dir: string,
	settings: ComponentGetterSettings
): Promise<string> {
	if (settings.fileName.overrides?.[path.parse(dir).base]) {
		return path.join(dir, settings.fileName.overrides[path.parse(dir).base])
	}

	const initialFile = (() => {
		switch (settings.fileName.initialFileStrategy.type) {
			case 'fileName':
				return settings.fileName.initialFileStrategy.fileName;
			case 'custom':
				return settings.fileName.initialFileStrategy.getFile(
					path.parse(dir).base
				);
			default:
				throw new Error('Unknown initial file strategy');
		}
	})();

	const joinedPath = path.join(dir, initialFile);
	const specificFileStrategy = settings.fileName.specificFileStrategy;
	if (!specificFileStrategy) {
		if (settings.fileName.caseInSensitive) {
			return path.join(
				dir,
				await findCaseInsensitiveFile(dir, initialFile)
			);
		}
		if (!(await fs.pathExists(joinedPath))) {
			throw new Error(`No file at path "${joinedPath}" for dir "${dir}"`);
		}
		return joinedPath;
	}

	return await (async () => {
		switch (specificFileStrategy!.type) {
			case 'importEndsWith': {
				const matches = (await getImportPaths(initialFile)).filter(
					(importPath) => {
						return importPath.endsWith(
							specificFileStrategy!.endsWith
						);
					}
				);

				if (matches.length === 0) {
					throw new Error(
						`Failed to find a match matches for files that end with "${
							specificFileStrategy!.endsWith
						}" for dir "${dir}"`
					);
				}
				if (matches.length > 1) {
					throw new Error(
						`Found multiple matches for files that end with "${
							specificFileStrategy!.endsWith
						}", "${matches.join(', ')}" for dir "${dir}"`
					);
				}
				return matches[0];
			}
			case 'matches': {
				const matches = (await getImportPaths(initialFile)).filter(
					(importPath) => {
						return specificFileStrategy.matches.some((m) =>
							m.test(importPath)
						);
					}
				);

				if (matches.length === 0) {
					throw new Error(
						`Failed to find a match matches for files that match for dir "${dir}"`
					);
				}
				if (matches.length > 1) {
					throw new Error(
						`Found multiple matches for files that match, "${matches.join(
							', '
						)}" for dir "${dir}"`
					);
				}
				return matches[0];
			}
			default:
				throw new Error('Unknown specific file strategy');
		}
	})();
}

async function tryReadFile(filePath: string): Promise<string | null> {
	return new Promise((resolve) => {
		readFile(filePath).then(
			(content) => {
				resolve(content);
			},
			() => {
				resolve(null);
			}
		);
	});
}

const EXTENSIONS = ['.ts', '.js'];
async function tryReadFileWithExtensions(
	filePath: string,
	extensions: string[]
): Promise<{
	content: string;
	filePath: string;
}> {
	let content: string | null = await tryReadFile(filePath);
	if (content)
		return {
			content,
			filePath,
		};
	for (const extension of extensions) {
		content = await tryReadFile(`${filePath}${extension}`);
		if (content)
			return {
				content,
				filePath: `${filePath}${extension}`,
			};
	}
	throw new Error(`Failed to find valid file for file path "${filePath}"`);
}

async function getComponentFiles(
	dir: string,
	settings: ComponentGetterSettings
): Promise<ComponentFiles> {
	const initialFilePath = await getFileName(dir, settings);
	const { content, filePath } = await tryReadFileWithExtensions(
		initialFilePath,
		EXTENSIONS
	);
	const componentName = (() => {
		if (settings.componentName === 'sameAsDir') {
			return path.parse(dir).base;
		}
		if (settings.componentName === 'fromFile') {
			// TODO:
		}
		throw new Error('Unknown component name setting');
	})();

	if (filePath.endsWith('.svelte') || filePath.endsWith('.vue')) {
		const { html, js } = splitSvelteIntoParts(content);

		return {
			html: {
				componentName,
				content: html,
				filePath: filePath,
			},
			js: {
				componentName,
				content: js,
				filePath: filePath,
			},
		};
	}
	return {
		js: {
			componentName,
			content,
			filePath,
		},
		html: null,
	};
}

export function createComponentGetter(
	settings: ComponentGetterSettings
): GetComponentFunction {
	return async (submodulePath: string) => {
		// Read
		const packagesPath = path.join(submodulePath, settings.packagesPath);
		let files = await fs.readdir(packagesPath);

		// Apply dir filter
		if (settings.filters.dirOnly) {
			files = await asyncFilter(files, async (dir) => {
				return (
					await fs.stat(path.join(packagesPath, dir))
				).isDirectory();
			});
		}
		// Apply file filter
		if (settings.filters.fileOnly) {
			files = await asyncFilter(files, async (dir) => {
				return !(
					await fs.stat(path.join(packagesPath, dir))
				).isDirectory();
			});
		}
		// Apply ignored filter
		if (settings.filters.ignored) {
			files = files.filter((file) => {
				return !settings.filters.ignored!.some((toIgnore) => {
					if (typeof toIgnore === 'string') {
						if (toIgnore === file) {
							return true;
						}
					} else {
						if (toIgnore.test(file)) {
							return true;
						}
					}
					return false;
				});
			});
		}

		// Get components
		return await Promise.all(
			files.map((file) =>
				getComponentFiles(path.join(packagesPath, file), settings)
			)
		);
	};
}
