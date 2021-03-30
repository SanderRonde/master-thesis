import * as path from 'path';
import { cmd, flag, setEnvVar } from 'makfy';
import * as fs from 'fs-extra';

import { METRICS_DIR } from '../../../collectors/shared/constants';
import { preserveCommandBuilder } from '../../lib/makfy-helper';
import {
	collectSameAsDashboardMetrics,
	DEMO_REPO_DIR,
} from '../../lib/cow-components-shared';
import { rimrafAsync, TS_NODE_COMMAND } from '../../lib/helpers';
import { getRenderTimeJsTemplate } from '../../../collectors/cow-components-angular/templates/render-time-js-template';
import { getRenderTimeHTMLTemplate } from '../../../collectors/cow-components-angular/templates/render-time-html-template';

const BASE_DIR = path.join(METRICS_DIR, `collectors/cow-components-angular`);

export const ANGULAR_DEMO_DIR = path.join(DEMO_REPO_DIR, 'angular');
const DEMO_METRICS_DIR = path.join(ANGULAR_DEMO_DIR, 'metrics');
const METRICS_COMPONENT_DIR = path.join(ANGULAR_DEMO_DIR, 'src/app');

export const cowComponentsAngularMetrics = preserveCommandBuilder(
	cmd('cow-components-angular-metrics')
		.desc('Collect cow-components-angular metrics')
		.args({
			'no-cache': flag(),
			prod: flag(),
		})
		.argsDesc({
			'no-cache': "Don't use cache and force rebuild",
			prod: 'Run in production mode',
		})
).run(async (exec, args) => {
	const baseCtx = args.prod
		? (await exec(setEnvVar('ENV', 'production'))).keepContext
		: exec;

	await collectSameAsDashboardMetrics(baseCtx, 'angular');

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

	if (
		!(await fs.pathExists(
			path.join(ANGULAR_DEMO_DIR, 'dist/angular-demo')
		)) ||
		args['no-cache']
	) {
		await rimrafAsync(DEMO_METRICS_DIR);
		await fs.mkdirp(DEMO_METRICS_DIR);
		await exec('? Generating toggleable bundle');

		await exec('? Generating JS');
		await fs.mkdirp(METRICS_COMPONENT_DIR);
		const jsFilePath = path.join(
			METRICS_COMPONENT_DIR,
			'metrics.component.ts'
		);
		const jsContent = await getRenderTimeJsTemplate();
		await fs.writeFile(jsFilePath, jsContent, 'utf8');

		await exec('? Generating HTML');
		const htmlFilePath = path.join(
			METRICS_COMPONENT_DIR,
			'metrics.component.html'
		);
		const htmlContent = await getRenderTimeHTMLTemplate();
		await fs.writeFile(htmlFilePath, htmlContent, 'utf8');

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
		const appModuleContent = await fs.readFile(appModulePath, 'utf8');
		await fs.writeFile(
			appModulePath,
			appModuleContent.replace('./app.component', './metrics.component'),
			'utf8'
		);
		const mainFilePath = path.join(ANGULAR_DEMO_DIR, 'src/main.ts');
		const mainFileContent = await fs.readFile(mainFilePath, 'utf8');
		await fs.writeFile(
			mainFilePath,
			mainFileContent.replace('/app.component', '/metrics.component'),
			'utf8'
		);

		await exec('? Bundling');
		const demoCtx = await exec(`cd ${ANGULAR_DEMO_DIR}`);
		await demoCtx.keepContext('ng build angular-demo');

		await exec('? Changing back used component for demo-project');
		await fs.writeFile(appModulePath, appModuleContent, 'utf8');
		await fs.writeFile(mainFilePath, mainFileContent, 'utf8');
	}

	await exec('? Collecting render time metrics');
	await baseCtx(
		`${TS_NODE_COMMAND} ${path.join(BASE_DIR, `render-time.ts`)}`
	);

	// TODO: collect metrics like size etc from this bundle
});
