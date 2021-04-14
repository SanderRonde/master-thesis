import * as fs from 'fs-extra';
import * as path from 'path';

import {
	registerInstallCommand,
	registerMetricsCommand,
	registerSetupCommand,
} from '../../../lib/makfy-helper';
import {
	collectSameAsDashboardBasicMetrics,
	DEMO_REPO_DIR_BASIC,
} from '../../../lib/cow-components-shared';
import { METRICS_DIR } from '../../../../collectors/shared/constants';
import { rimrafAsync, TS_NODE_COMMAND } from '../../../lib/helpers';
import { getRenderTimeJsTemplate } from '../../../../collectors/cow-components-basic/cow-components-native/templates/render-time-js-template';
import { getRenderTimeHTMLTemplate } from '../../../../collectors/cow-components-basic/cow-components-native/templates/render-time-html-template';
import { writeFile } from '../../../../collectors/shared/files';

const DEMO_DIR = path.join(DEMO_REPO_DIR_BASIC, 'native');
const DEMO_METRICS_DIR = path.join(DEMO_DIR, 'metrics');
export const NATIVE_DEMO_METRICS_TOGGLEABLE_DIR = path.join(
	DEMO_METRICS_DIR,
	'toggleable'
);
const BASE_DIR = path.join(
	METRICS_DIR,
	`collectors/cow-components-basic/cow-components-native`
);

export const cowComponentsNativeInstall = registerInstallCommand(
	'cow-components-basic-native'
).run(async (exec) => {
	await exec('? Installing dependencies');
	await exec(`yarn --cwd ${DEMO_DIR} || yarn --cwd ${DEMO_DIR} || yarn --cwd ${DEMO_DIR}`);
});

export const cowComponentsNativeSetup = registerSetupCommand(
	'cow-components-basic-native'
).run(async (exec) => {
	await rimrafAsync(DEMO_METRICS_DIR);
	await exec('? Generating toggleable bundle');

	await exec('? Generating JS');
	const indexJsFilePath = path.join(
		NATIVE_DEMO_METRICS_TOGGLEABLE_DIR,
		'index.ts'
	);
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
});

export const cowComponentsNativeMetrics = registerMetricsCommand(
	'cow-components-native'
).run(async (exec) => {
	await collectSameAsDashboardBasicMetrics(exec, 'native');

	await exec('? Collecting bundle metadata metrics');
	await exec(`${TS_NODE_COMMAND} ${path.join(BASE_DIR, `load-time.ts`)}`);
	await exec(`${TS_NODE_COMMAND} ${path.join(BASE_DIR, `size.ts`)}`);

	await exec('? Collecting render time metrics');
	await exec(`${TS_NODE_COMMAND} ${path.join(BASE_DIR, `render-time.ts`)}`);
});
