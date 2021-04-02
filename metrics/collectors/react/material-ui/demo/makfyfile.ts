import { cmd } from 'makfy';
import * as path from 'path';

import { TEMPLATES_DIR } from '../../../shared/constants';
import { createCopies } from '../../../shared/files';

const SYMLINK_PATHS = {
	'demo.html': path.join(TEMPLATES_DIR, 'demo-no-css.html'),
};

cmd('build')
	.desc('Build')
	.run(async (exec) => {
		await exec('? Installing dependencies');
		await exec(`yarn --cwd ${__dirname}`);

		await exec('? Creating copies for template files');
		await createCopies(SYMLINK_PATHS, __dirname);

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
