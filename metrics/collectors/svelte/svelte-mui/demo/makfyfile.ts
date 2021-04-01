import { cmd } from 'makfy';
import * as path from 'path';

import { TEMPLATES_DIR } from '../../../shared/constants';
import { SVELTE_TEMPLATES_DIR } from '../../shared/constants';
import { createCopies } from '../../../shared/files';

const SYMLINK_PATHS = {
	'demo.html': path.join(TEMPLATES_DIR, 'demo.html'),
	'demo.js': path.join(SVELTE_TEMPLATES_DIR, 'demo.js'),
	'rollup.config.js': path.join(SVELTE_TEMPLATES_DIR, 'rollup.config.js'),
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
			`yarn --cwd ${__dirname} rollup --config ${path.join(__dirname, 'rollup.config.js')}`
		);
	});
