import * as fs from 'fs-extra';
import * as path from 'path';
import { ExecFunction } from 'makfy/dist/lib/schema/runtime';
import { transformFile, writeFile } from '../../shared/files';

export async function createSingleVueEntrypoint(exec: ExecFunction, baseDir: string) {
	await exec('? Creating JS bundle entrypoint');
	const files = (
		await fs.readdir(path.join(baseDir, 'dist/js/'))
	).filter((file) => file.endsWith('.js'));

	const fakeEntrypoint = `${files
		.map((file) => `import './js/${file}';`)
		.join('\n')}`;
	await writeFile(path.join(baseDir, 'dist/demo.js'), fakeEntrypoint);

	await exec('? Bundling');
	await exec(
		`esbuild ${path.join(
			baseDir,
			'dist/demo.js'
		)} --bundle --minify --outfile=${path.join(
			baseDir,
			'dist/demo.bundle.js'
		)}`
	);

	await exec('? Adding bundle to HTML file');
	await transformFile(path.join(baseDir, 'dist/index.html'), (file) => {
		return file.replace(
			/<\/body>/,
			'<script src="./demo.bundle.js"></script></body>'
		);
	});

	await exec('? Removing extraneous JS files');
	await Promise.all(
		files.map((file) => {
			return fs.unlink(path.join(baseDir, 'dist/js/', file));
		})
	);
}
