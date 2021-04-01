import * as path from 'path';
import * as fs from 'fs-extra';

import { METRICS_DIR } from '../../../collectors/shared/constants';
import { registerMetricsCommand } from '../../lib/makfy-helper';
import {
	collectSameAsDashboardMetrics,
	DEMO_REPO_DIR,
} from '../../lib/cow-components-shared';
import { cpxAsync, rimrafAsync, TS_NODE_COMMAND } from '../../lib/helpers';
import { getRenderTimeJsTemplate } from '../../../collectors/cow-components/cow-components-angular/templates/render-time-js-template';
import { getRenderTimeHTMLTemplate } from '../../../collectors/cow-components/cow-components-angular/templates/render-time-html-template';
import { concatIntoBundle } from './dashboard';
import { readFile, writeFile } from '../../../collectors/shared/files';

const BASE_DIR = path.join(METRICS_DIR, `collectors/cow-components-angular`);

export const ANGULAR_DEMO_DIR = path.join(DEMO_REPO_DIR, 'angular');
const DEMO_METRICS_DIR = path.join(ANGULAR_DEMO_DIR, 'metrics');
const METRICS_COMPONENT_DIR = path.join(ANGULAR_DEMO_DIR, 'src/app');
const ANGULAR_DEMO_DIST = path.join(ANGULAR_DEMO_DIR, 'dist/angular-demo');
export const ANGULAR_METADATA_BUNDLE = path.join(ANGULAR_DEMO_DIST, 'metadata');

export const cowComponentsAngularSetup = registerMetricsCommand(
	'cow-components-angular'
).run(async (exec, args) => {
	// For Angular we use the regular bundle for size and load-time
	// testing. This is because it will be excluded from the build
	// if not used. And the few bytes added should not make a big
	// difference
	await exec('? Installing dependencies');
	const demoDirCtx = await exec(`cd ${ANGULAR_DEMO_DIR}`);
	await demoDirCtx.keepContext('npm install');

	/**
	 * The angular compiler requires a TS version
	 * >= 3.9.2 and < 4.1, so we use 4.0.7
	 */
	await exec('? Installing specific TS version');
	await demoDirCtx.keepContext('npm install typescript@4.0.7');

	if (!(await fs.pathExists(ANGULAR_DEMO_DIST)) || args['no-cache']) {
		await rimrafAsync(DEMO_METRICS_DIR);
		await exec('? Generating toggleable bundle');

		await exec('? Generating JS');
		const jsFilePath = path.join(
			METRICS_COMPONENT_DIR,
			'metrics.component.ts'
		);
		const jsContent = await getRenderTimeJsTemplate();
		await writeFile(jsFilePath, jsContent);

		await exec('? Generating HTML');
		const htmlFilePath = path.join(
			METRICS_COMPONENT_DIR,
			'metrics.component.html'
		);
		const htmlContent = await getRenderTimeHTMLTemplate();
		await writeFile(htmlFilePath, htmlContent);

		await exec('? Copying CSS');
		await fs.copy(
			path.join(
				ANGULAR_DEMO_DIR,
				'packages/angular/assets/cow-components.css'
			),
			path.join(ANGULAR_DEMO_DIR, 'src/assets', 'cow-components.css')
		);

		await exec('? Changing demo-project to use new component');
		const appModulePath = path.join(METRICS_COMPONENT_DIR, 'app.module.ts');
		const appModuleContent = await readFile(appModulePath);
		await writeFile(
			appModulePath,
			appModuleContent.replace('./app.component', './metrics.component')
		);
		const mainFilePath = path.join(ANGULAR_DEMO_DIR, 'src/main.ts');
		const mainFileContent = await readFile(mainFilePath);
		await writeFile(
			mainFilePath,
			mainFileContent.replace('/app.component', '/metrics.component')
		);

		await exec('? Bundling');
		const demoCtx = await exec(`cd ${ANGULAR_DEMO_DIR}`);
		await demoCtx.keepContext('ng build angular-demo');

		await exec('? Changing back used component for demo-project');
		await writeFile(appModulePath, appModuleContent);
		await writeFile(mainFilePath, mainFileContent);
	}

	await exec('? Bundling up built files for measuring');
	await rimrafAsync(ANGULAR_METADATA_BUNDLE);
	await fs.mkdirp(ANGULAR_METADATA_BUNDLE);
	await cpxAsync(`${ANGULAR_DEMO_DIST}/**`, ANGULAR_METADATA_BUNDLE);
	await concatIntoBundle(exec, ANGULAR_METADATA_BUNDLE);
});

export const cowComponentsAngularMetrics = registerMetricsCommand(
	'cow-components-angular'
).run(async (exec) => {
	await collectSameAsDashboardMetrics(exec, 'angular');

	await exec('? Collecting render time metrics');
	await exec(`${TS_NODE_COMMAND} ${path.join(BASE_DIR, `render-time.ts`)}`);

	await exec('? Collecting bundle metadata metrics');
	await exec(`${TS_NODE_COMMAND} ${path.join(BASE_DIR, `load-time.ts`)}`);
	await exec(`${TS_NODE_COMMAND} ${path.join(BASE_DIR, `size.ts`)}`);
});
