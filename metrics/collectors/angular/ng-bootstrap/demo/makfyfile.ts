import { cmd } from 'makfy';
import * as path from 'path';

import { transformFile, writeFile } from '../../../shared/files';

const OUTPUT_DIR = path.join(__dirname, 'dist/demo');

cmd('build')
	.desc('Build')
	.run(async (exec) => {
		await exec('? Installing dependencies');
		await exec(`yarn --cwd ${__dirname}`);

		await exec('? Building');
		await exec(`yarn --cwd ${__dirname} angular-build`);

		await exec('? Bundling output files');
		const importerFile = `
		import './main.js';
		import './polyfills.js';
		import './runtime.js';
		import './styles.js';
		import './vendor.js';
		`;
		const importFilePath = path.join(OUTPUT_DIR, 'index.js');
		await writeFile(importFilePath, importerFile);
		await exec(
			`esbuild ${importFilePath} --bundle --minify --outfile=${path.join(
				OUTPUT_DIR,
				'index.bundle.js'
			)}`
		);

		await transformFile(path.join(OUTPUT_DIR, 'index.html'), (content) => {
			const scriptTagsRemoved = content.replace(
				/<script.*\/script>/g,
				''
			);
			return scriptTagsRemoved.replace(
				'</body>',
				'<script src="index.bundle.js"></script></body>'
			);
		});
	});
