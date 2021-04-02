import * as ts from 'typescript';
import * as path from 'path';

import { DASHBOARD_DIR } from './constants';
import { readFile } from './files';

function moduleResolutionToEnum(
	moduleResolution: string
): ts.ModuleResolutionKind {
	switch (moduleResolution) {
		case 'node':
		case 'Node':
			return ts.ModuleResolutionKind.NodeJs;
		case 'classic':
		case 'Classic':
			return ts.ModuleResolutionKind.Classic;
	}
	throw new Error(
		`Unknown module resolution strategy "${moduleResolution}" found in tsconfig.json`
	);
}

export async function createTSProgram(
	sourceFiles: string[]
): Promise<ts.Program> {
	const rootTSConfig = JSON.parse(
		await readFile(path.join(DASHBOARD_DIR, 'tsconfig.json'))
	);
	const appTSConfig = JSON.parse(
		await readFile(path.join(DASHBOARD_DIR, 'src', 'tsconfig.app.json'))
	);
	return ts.createProgram({
		rootNames: sourceFiles,
		options: {
			...rootTSConfig.compilerOptions,
			...appTSConfig.compilerOptions,
			moduleResolution: moduleResolutionToEnum(
				appTSConfig.compilerOptions.moduleResolution ||
					rootTSConfig.compilerOptions.moduleResolution
			),
		},
	});
}

function createCompilerHost(
	getSourceFileCode: (fileName: string) => string | void
): ts.CompilerHost {
	return {
		fileExists(fileName) {
			return !!getSourceFileCode(fileName);
		},
		getCanonicalFileName(fileName) {
			return fileName;
		},
		getCurrentDirectory() {
			return DASHBOARD_DIR;
		},
		getDefaultLibFileName() {
			return 'lib.d.ts';
		},
		getNewLine() {
			return '\n';
		},
		getSourceFile: (fileName, _languageVersion) => {
			const sourceCode = getSourceFileCode(fileName);
			if (!sourceCode) {
				return undefined;
			}
			return ts.createSourceFile(
				fileName,
				sourceCode,
				ts.ScriptTarget.Latest,
				true
			);
		},
		readFile: (fileName) => {
			const sourceCode = getSourceFileCode(fileName);
			if (!sourceCode) {
				throw new Error(`Failed to find TS source file "${fileName}"`);
			}
			return sourceCode;
		},
		useCaseSensitiveFileNames() {
			return true;
		},
		writeFile() {
			return undefined;
		},
	};
}

interface TSProgram {
	ast: ts.SourceFile;
	typeChecker: ts.TypeChecker;
}

export async function createSingleFileTSProgram(
	code: string
): Promise<TSProgram> {
	const compilerHost = createCompilerHost(() => code);

	const fileName = 'sourcefile.ts';
	const program = ts.createProgram(
		[fileName],
		{
			noResolve: true,
			target: ts.ScriptTarget.Latest,
			experimentalDecorators: true,
			jsxFactory: 'html.jsx',
			jsx: ts.JsxEmit.React,
			jsxFragmentFactory: 'html.Fragment',
		},
		compilerHost
	);

	const ast = program.getSourceFile(fileName);
	if (!ast) {
		throw new Error(
			`Failed to parse file "${fileName}" into typescript AST`
		);
	}
	return {
		ast,
		typeChecker: program.getTypeChecker(),
	};
}
