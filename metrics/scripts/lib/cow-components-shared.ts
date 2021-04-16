import { ExecFunction } from 'makfy/dist/lib/schema/runtime';
import * as path from 'path';
import * as fs from 'fs-extra';

import {
	BASIC_DASHBOARD_DIR,
	DASHBOARD_DIR,
} from '../../collectors/shared/constants';
import { readFile, writeFile } from '../../collectors/shared/files';
import { asyncGlob } from '../../collectors/shared/helpers';
import { htmlTemplate } from '../../collectors/shared/templates';

export const DEMO_REPO_DIR = path.join(DASHBOARD_DIR, 'dist/demo-repo');
export const DEMO_REPO_DIR_BASIC = path.join(
	BASIC_DASHBOARD_DIR,
	'dist/demo-repo'
);

export function getToggleableDir(baseDir: string, framework: string) {
	return path.join(
		baseDir,
		'dist/demo-repo',
		framework,
		'metrics',
		'toggleable'
	);
}

export const ANGULAR_EXCLUDED_FILES = [
	'ngsw-worker.js',
	'extended-service-worker.js',
	'safety-worker.js',
	'worker-basic.min.js',
	'concatenated.js',
	'bundle.js',
];

async function getAngularJsFilesInDir(dir: string): Promise<string[]> {
	const allJsFiles = await asyncGlob('*.js', {
		cwd: dir,
	});
	const files = allJsFiles.filter(
		(file) => !ANGULAR_EXCLUDED_FILES.includes(file)
	);
	return files.map((file) => path.join(dir, file));
}

export async function concatIntoBundle(exec: ExecFunction, dir: string) {
	await exec('? Concatenating into bundle');
	const files = await Promise.all(
		(await getAngularJsFilesInDir(dir)).map((file) => {
			return readFile(file);
		})
	);
	const bundle = files.reduce((prev, current) => {
		return `${prev}\n\n${current}`;
	});
	const concatenatedFilePath = path.join(dir, 'concatenated.js');
	await writeFile(concatenatedFilePath, bundle);

	await exec('? Creating index.html file');
	await writeFile(
		path.join(dir, 'index.html'),
		htmlTemplate({ jsPath: 'bundle.js' })
	);

	await exec('? Bundling');
	try {
		await fs.unlink(path.join(dir, 'bundle.js'));
	} catch (e) {}
	await exec(
		`esbuild ${concatenatedFilePath} --bundle --minify --outfile=${path.join(
			dir,
			'bundle.js'
		)}`
	);
}
