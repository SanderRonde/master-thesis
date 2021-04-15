import { cmd } from 'makfy';
import { createSingleVueEntrypoint } from '../../shared/build';

cmd('build')
	.desc('Build')
	.run(async (exec) => {
		await exec('? Installing dependencies');
		await exec(`yarn --cwd ${__dirname}`);

		await exec('? Building');
		await exec(`yarn --cwd ${__dirname} build-vue`);

		await createSingleVueEntrypoint(exec, __dirname);
	});
