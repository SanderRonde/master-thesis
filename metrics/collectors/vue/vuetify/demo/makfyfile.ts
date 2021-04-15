import { cmd } from 'makfy';
import * as path from 'path';
import * as fs from 'fs-extra';
import { transformFile, writeFile } from '../../../shared/files';

cmd('build')
	.desc('Build')
	.run(async (exec) => {
		await exec('? Installing dependencies');
		await exec(`yarn --cwd ${__dirname}`);

		await exec('? Building');
		await exec(`yarn --cwd ${__dirname} build-vue`);

		await exec('? Creating JS bundle entrypoint');
		const files = (
			await fs.readdir(path.join(__dirname, 'dist/js/'))
		).filter((file) => file.endsWith('.js'));

		const fakeEntrypoint = `${files
			.map((file) => `import './js/${file}';`)
			.join('\n')}`;
		await writeFile(path.join(__dirname, 'dist/demo.js'), fakeEntrypoint);

		await exec('? Bundling');
		await exec(
			`esbuild ${path.join(
				__dirname,
				'dist/demo.js'
			)} --bundle --minify --outfile=${path.join(
				__dirname,
				'dist/demo.bundle.js'
			)}`
		);

		await exec('? Adding bundle to HTML file');
		await transformFile(path.join(__dirname, 'dist/index.html'), (file) => {
			return file.replace(
				/<\/body>/,
				'<script src="./demo.bundle.js"></script></body>'
			);
		});

		await exec('? Removing extraneous JS files');
		await Promise.all(
			files.map((file) => {
				return fs.unlink(path.join(__dirname, 'dist/js/', file));
			})
		);
	});
