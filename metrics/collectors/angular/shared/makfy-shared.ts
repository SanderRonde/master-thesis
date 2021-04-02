import { ExecFunction } from 'makfy/dist/lib/schema/runtime';
import * as path from 'path';
import { transformFile, writeFile } from '../../shared/files';

export async function buildAngularApp(
	exec: ExecFunction,
	outputDir: string,
	dirName: string
) {
	await exec('? Installing dependencies');
	await exec(`yarn --cwd ${dirName}`);

	await exec('? Building');
	await exec(`yarn --cwd ${dirName} angular-build`);

	await exec('? Bundling output files');
	const importerFile = `
		import './main.js';
		import './polyfills.js';
		import './runtime.js';
		import './styles.js';
		import './vendor.js';
		`;
	const importFilePath = path.join(outputDir, 'index.js');
	await writeFile(importFilePath, importerFile);
	await exec(
		`esbuild ${importFilePath} --bundle --minify --outfile=${path.join(
			outputDir,
			'index.bundle.js'
		)}`
	);

	await transformFile(path.join(outputDir, 'index.html'), (content) => {
		const scriptTagsRemoved = content.replace(/<script.*\/script>/g, '');
		return scriptTagsRemoved.replace(
			'</body>',
			'<script src="index.bundle.js"></script></body>'
		);
	});
}
