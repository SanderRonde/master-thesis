import * as fs from 'fs-extra';
import * as path from 'path';

import { registerSetupCommand } from '../../../lib/makfy-helper';
import { rimrafAsync } from '../../../lib/helpers';
import { writeFile } from '../../../../collectors/shared/files';
import { getCowComponentsDirs } from '../shared';
import { htmlTemplate } from '../../../../collectors/shared/templates';
import { getRenderTimeJsTemplate } from './templates/render-time-js-template';

export function createNativeSetupCommand(
	commandName: string,
	baseDir: string,
	submoduleName: string
) {
	const {
		demoMetricsDir,
		frameworkDemoDir,
		toggleableDir,
	} = getCowComponentsDirs(baseDir, 'native');

	return registerSetupCommand(commandName).run(async (exec) => {
		await rimrafAsync(demoMetricsDir);
		await exec('? Generating toggleable bundle');

		await exec('? Generating JS');
		const indexJsFilePath = path.join(toggleableDir, 'index.ts');
		const indexJsContent = await getRenderTimeJsTemplate(submoduleName);
		await writeFile(indexJsFilePath, indexJsContent);

		await exec('? Generating HTML');
		const indexHtmlFilePath = path.join(toggleableDir, 'index.html');
		const indexHtmlContent = htmlTemplate();
		await writeFile(indexHtmlFilePath, indexHtmlContent);

		await exec('? Copying CSS');
		await fs.copy(
			path.join(
				frameworkDemoDir,
				'packages/native/styles/cow-components.css'
			),
			path.join(toggleableDir, 'index.css')
		);

		await exec('? Bundling');
		await exec(
			`esbuild ${indexJsFilePath} --bundle --minify --outfile=${path.join(
				toggleableDir,
				'index.bundle.js'
			)}`
		);
	});
}
