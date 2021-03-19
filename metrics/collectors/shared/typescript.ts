import * as ts from 'typescript';
import * as path from 'path';
import * as fs from 'fs-extra';

import { DASHBOARD_DIR } from './constants';

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
		await fs.readFile(path.join(DASHBOARD_DIR, 'tsconfig.json'), {
			encoding: 'utf8',
		})
	);
	const appTSConfig = JSON.parse(
		await fs.readFile(
			path.join(DASHBOARD_DIR, 'src', 'tsconfig.app.json'),
			{
				encoding: 'utf8',
			}
		)
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
