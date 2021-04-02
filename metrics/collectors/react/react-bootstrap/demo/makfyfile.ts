import { cmd } from 'makfy';
import * as path from 'path';

cmd('build')
	.desc('Build')
	.run(async (exec) => {
		await exec('? Installing dependencies');
		await exec(`yarn --cwd ${__dirname}`);

		await exec('? Building');
		await exec(
			`esbuild ${path.join(
				__dirname,
				'App.tsx'
			)} --bundle --minify --outfile=${path.join(
				__dirname,
				'demo.bundle.js'
			)} --define:process.env.NODE_ENV=\\"production\\"`
		);
	});
