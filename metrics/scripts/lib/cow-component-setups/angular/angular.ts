import * as fs from 'fs-extra';
import * as path from 'path';

import { registerSetupCommand } from '../../../lib/makfy-helper';
import { cpxAsync, rimrafAsync } from '../../../lib/helpers';
import { readFile, writeFile } from '../../../../collectors/shared/files';
import { getCowComponentsDirs } from '../shared';
import { getRenderTimeJsTemplate } from './templates/render-time-js-template';
import { getRenderTimeHTMLTemplate } from './templates/render-time-html-template';
import { concatIntoBundle } from '../../cow-components-shared';

export function getAngularDirs(baseDir: string) {
	const { frameworkDemoDir } = getCowComponentsDirs(baseDir, 'angular');

	const angularDemoDist = path.join(frameworkDemoDir, 'dist/angular-demo');
	const metricsComponentDir = path.join(frameworkDemoDir, 'src/app');
	const angularMetadataBundle = path.join(angularDemoDist, 'metadata');

	return {
		angularDemoDist,
		metricsComponentDir,
		angularMetadataBundle,
	};
}

export function createAngularSetupCommand(
	commandName: string,
	baseDir: string
) {
	const { demoMetricsDir, frameworkDemoDir } = getCowComponentsDirs(
		baseDir,
		'angular'
	);
	const {
		angularDemoDist,
		angularMetadataBundle,
		metricsComponentDir,
	} = getAngularDirs(baseDir);

	return registerSetupCommand(commandName).run(async (exec, args) => {
		/**
		 * The angular compiler requires a TS version
		 * >= 3.9.2 and < 4.1, so we use 4.0.7
		 */
		await exec('? Installing specific TS version');
		const demoDirCtx = await exec(`cd ${frameworkDemoDir}`);
		await demoDirCtx.keepContext('npm install typescript@4.0.7');

		if (!(await fs.pathExists(angularDemoDist)) || args['no-cache']) {
			await rimrafAsync(demoMetricsDir);
			await exec('? Generating toggleable bundle');

			await exec('? Generating JS');
			const jsFilePath = path.join(
				metricsComponentDir,
				'metrics.component.ts'
			);
			const jsContent = await getRenderTimeJsTemplate();
			await writeFile(jsFilePath, jsContent);

			await exec('? Generating HTML');
			const htmlFilePath = path.join(
				metricsComponentDir,
				'metrics.component.html'
			);
			const htmlContent = await getRenderTimeHTMLTemplate();
			await writeFile(htmlFilePath, htmlContent);

			await exec('? Copying CSS');
			await fs.copy(
				path.join(
					frameworkDemoDir,
					'packages/angular/assets/cow-components.css'
				),
				path.join(frameworkDemoDir, 'src/assets', 'cow-components.css')
			);

			await exec('? Changing demo-project to use new component');
			const appModulePath = path.join(
				metricsComponentDir,
				'app.module.ts'
			);
			const appModuleContent = await readFile(appModulePath);
			await writeFile(
				appModulePath,
				appModuleContent.replace(
					'./app.component',
					'./metrics.component'
				)
			);
			const mainFilePath = path.join(frameworkDemoDir, 'src/main.ts');
			const mainFileContent = await readFile(mainFilePath);
			await writeFile(
				mainFilePath,
				mainFileContent.replace('/app.component', '/metrics.component')
			);

			await exec('? Bundling');
			const demoCtx = await exec(`cd ${frameworkDemoDir}`);
			await demoCtx.keepContext('ng build angular-demo');

			await exec('? Changing back used component for demo-project');
			await writeFile(appModulePath, appModuleContent);
			await writeFile(mainFilePath, mainFileContent);
		}

		await exec('? Bundling up built files for measuring');
		await rimrafAsync(angularMetadataBundle);
		await fs.mkdirp(angularMetadataBundle);
		await cpxAsync(`${angularDemoDist}/**`, angularMetadataBundle);
		await concatIntoBundle(exec, angularMetadataBundle);
	});
}
