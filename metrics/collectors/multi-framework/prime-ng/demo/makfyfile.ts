import { cmd } from 'makfy';
import * as path from 'path';

import { buildAngularApp } from '../../../angular/shared/makfy-shared';

const OUTPUT_DIR = path.join(__dirname, 'dist/demo');

cmd('build')
	.desc('Build')
	.run(async (exec) => {
		await buildAngularApp(exec, OUTPUT_DIR, __dirname);
	});
