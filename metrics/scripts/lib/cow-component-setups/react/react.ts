import * as fs from 'fs-extra';
import * as path from 'path';

import { registerSetupCommand } from '../../../lib/makfy-helper';
import { rimrafAsync } from '../../../lib/helpers';
import { getRenderTimeJsTemplate } from './templates/render-time-js-template';
import { writeFile } from '../../../../collectors/shared/files';
import { getCowComponentsDirs } from '../shared';
import { htmlTemplate } from '../../../../collectors/shared/templates';

export function createReactSetupCommand(commandName: string, baseDir: string) {
	const {
		demoMetricsDir,
		frameworkDemoDir,
		toggleableDir,
	} = getCowComponentsDirs(baseDir, 'react');

	return registerSetupCommand(commandName).run(async (exec) => {
		await rimrafAsync(demoMetricsDir);
		await exec('? Generating toggleable bundle');

		await exec('? Generating JS');
		const indexJsFilePath = path.join(toggleableDir, 'index.tsx');
		const indexJsContent = await getRenderTimeJsTemplate();
		await writeFile(indexJsFilePath, indexJsContent);

		await exec('? Generating HTML');
		const indexHtmlFilePath = path.join(toggleableDir, 'index.html');
		const indexHtmlContent = htmlTemplate();
		await writeFile(indexHtmlFilePath, indexHtmlContent);

		await exec('? Copying CSS');
		await fs.copy(
			path.join(
				frameworkDemoDir,
				'packages/react/styles/cow-components.css'
			),
			path.join(toggleableDir, 'index.css')
		);

		await exec('? Bundling');
		await exec(
			`esbuild ${indexJsFilePath} --bundle --minify --outfile=${path.join(
				toggleableDir,
				'index.bundle.js'
			)} --define:process.env.NODE_ENV=\\"production\\"`
		);
	});
}
