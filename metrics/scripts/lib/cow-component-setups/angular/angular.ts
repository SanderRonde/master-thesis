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
	const angularToggleableDemoDist = path.join(
		frameworkDemoDir,
		'dist/angular-toggleable'
	);
	const metricsComponentDir = path.join(frameworkDemoDir, 'src/app');
	const angularMetadataBundle = path.join(
		angularToggleableDemoDist,
		'metadata'
	);

	return {
		angularDemoDist,
		angularToggleableDemoDist,
		metricsComponentDir,
		angularMetadataBundle,
	};
}

export function createAngularSetupCommand(
	commandName: string,
	baseDir: string,
	submoduleName: string
) {
	const { demoMetricsDir, frameworkDemoDir } = getCowComponentsDirs(
		baseDir,
		'angular'
	);
	const {
		angularToggleableDemoDist,
		angularMetadataBundle,
		metricsComponentDir,
	} = getAngularDirs(baseDir);

	return registerSetupCommand(commandName).run(async (exec) => {
		/**
		 * The angular compiler requires a TS version
		 * >= 3.9.2 and < 4.1, so we use 4.0.7
		 */
		await exec('? Installing specific TS version');
		const demoDirCtx = await exec(`cd ${frameworkDemoDir}`);
		await demoDirCtx.keepContext('npm install typescript@4.0.7');

		await rimrafAsync(demoMetricsDir);
		await exec('? Generating toggleable bundle');

		await exec('? Generating JS');
		const jsFilePath = path.join(
			metricsComponentDir,
			'metrics.component.ts'
		);
		const jsContent = await getRenderTimeJsTemplate(submoduleName);
		await writeFile(jsFilePath, jsContent);

		await exec('? Generating HTML');
		const htmlFilePath = path.join(
			metricsComponentDir,
			'metrics.component.html'
		);
		const htmlContent = await getRenderTimeHTMLTemplate(submoduleName);
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
		const appModulePath = path.join(metricsComponentDir, 'app.module.ts');
		const appModuleContent = await readFile(appModulePath);
		await writeFile(
			appModulePath,
			appModuleContent.replace('./app.component', './metrics.component')
		);
		const mainFilePath = path.join(frameworkDemoDir, 'src/main.ts');
		const mainFileContent = await readFile(mainFilePath);
		await writeFile(
			mainFilePath,
			mainFileContent.replace('/app.component', '/metrics.component')
		);

		await exec('? Changing output dir');
		const angularJsonFilePath = path.join(frameworkDemoDir, 'angular.json');
		const angularJsonContent = await readFile(angularJsonFilePath);
		await writeFile(
			angularJsonFilePath,
			angularJsonContent.replace(
				'dist/angular-demo',
				'dist/angular-toggleable'
			)
		);

		await exec('? Bundling');
		const demoCtx = await exec(`cd ${frameworkDemoDir}`);
		await demoCtx.keepContext('npm install');
		const demoPackageCtx = await exec(
			`cd ${path.join(frameworkDemoDir, 'packages/angular')}`
		);
		const cowComponentsLibCtx = await exec(
			`cd ${path.join(
				frameworkDemoDir,
				'packages/angular/cow-components-lib'
			)}`
		);
		await cowComponentsLibCtx.keepContext('npm link');
		await demoPackageCtx.keepContext('npm install');
		await demoCtx.keepContext('yarn build');

		await exec('? Changing back used component for demo-project');
		await writeFile(appModulePath, appModuleContent);
		await writeFile(mainFilePath, mainFileContent);
		await writeFile(angularJsonFilePath, angularJsonContent);

		await exec('? Bundling up built files for measuring');
		await rimrafAsync(angularMetadataBundle);
		await fs.mkdirp(angularMetadataBundle);
		await cpxAsync(
			`${angularToggleableDemoDist}/**`,
			angularMetadataBundle
		);
		await concatIntoBundle(exec, angularMetadataBundle);
	});
}
