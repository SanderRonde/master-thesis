import { cmd, flag, setEnvVar } from 'makfy';
import * as fs from 'fs-extra';
import * as path from 'path';

import { preserveCommandBuilder } from '../../lib/makfy-helper';
import {
	collectEmptyBundleMetrics,
	collectSameAsDashboardMetrics,
	createEmptyBundle,
	DEMO_REPO_DIR,
} from '../../lib/cow-components-shared';
import { METRICS_DIR } from '../../../collectors/shared/constants';
import { rimrafAsync, TS_NODE_COMMAND } from '../../lib/helpers';
import { getRenderTimeJsTemplate } from '../../../collectors/cow-components-native/templates/render-time-js-template';
import { getRenderTimeHTMLTemplate } from '../../../collectors/cow-components-native/templates/render-time-html-template';
import { writeFile } from '../../../collectors/shared/files';

const DEMO_DIR = path.join(DEMO_REPO_DIR, 'native');
const DEMO_METRICS_DIR = path.join(DEMO_DIR, 'metrics');
export const NATIVE_DEMO_METRICS_TOGGLEABLE_DIR = path.join(
	DEMO_METRICS_DIR,
	'toggleable'
);
const BASE_DIR = path.join(METRICS_DIR, `collectors/cow-components-native`);

export const cowComponentsNativeMetrics = preserveCommandBuilder(
	cmd('cow-components-native-metrics')
		.desc('Collect cow-components-native metrics')
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

	await collectSameAsDashboardMetrics(baseCtx, 'native');

	await createEmptyBundle(baseCtx, 'native');

	await collectEmptyBundleMetrics(baseCtx, 'native');

	await exec('? Installing dependencies');
	await exec(`yarn --cwd ${DEMO_DIR}`);

	await rimrafAsync(DEMO_METRICS_DIR);
	await exec('? Generating toggleable bundle');

	await exec('? Generating JS');
	const indexJsFilePath = path.join(NATIVE_DEMO_METRICS_TOGGLEABLE_DIR, 'index.ts');
	const indexJsContent = await getRenderTimeJsTemplate();
	await writeFile(indexJsFilePath, indexJsContent);

	await exec('? Generating HTML');
	const indexHtmlFilePath = path.join(
		NATIVE_DEMO_METRICS_TOGGLEABLE_DIR,
		'index.html'
	);
	const indexHtmlContent = await getRenderTimeHTMLTemplate();
	await writeFile(indexHtmlFilePath, indexHtmlContent);

	await exec('? Copying CSS');
	await fs.copy(
		path.join(DEMO_DIR, 'packages/native/styles/cow-components.css'),
		path.join(NATIVE_DEMO_METRICS_TOGGLEABLE_DIR, 'index.css')
	);

	await exec('? Bundling');
	await exec(
		`esbuild ${indexJsFilePath} --bundle --minify --outfile=${path.join(
			NATIVE_DEMO_METRICS_TOGGLEABLE_DIR,
			'index.bundle.js'
		)}`
	);

	await exec('? Collecting render time metrics');
	await baseCtx(
		`${TS_NODE_COMMAND} ${path.join(BASE_DIR, `render-time.ts`)}`
	);
});
