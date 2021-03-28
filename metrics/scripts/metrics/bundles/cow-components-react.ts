import { cmd, flag, setEnvVar } from 'makfy';
import * as fs from 'fs-extra';
import * as path from 'path';

import { preserveCommandBuilder } from '../../lib/makfy-helper';
import {
	collectSameAsDashboardMetrics,
	createEmptyBundle,
	collectEmptyBundleMetrics,
	DEMO_REPO_DIR,
} from '../../lib/cow-components-shared';
import { ifTrue, rimrafAsync, TS_NODE_COMMAND } from '../../lib/helpers';
import { getRenderTimeJsTemplate } from '../../../collectors/cow-components-react/templates/render-time-js-template';
import { getRenderTimeHTMLTemplate } from '../../../collectors/cow-components-react/templates/render-time-html-template';
import { METRICS_DIR } from '../../../collectors/shared/constants';

const DEMO_DIR = path.join(DEMO_REPO_DIR, 'react');
const DEMO_METRICS_DIR = path.join(DEMO_DIR, 'metrics');
export const DEMO_METRICS_TOGGLEABLE_DIR = path.join(
	DEMO_METRICS_DIR,
	'toggleable'
);
const BASE_DIR = path.join(METRICS_DIR, `collectors/cow-components-react`);

export const cowComponentsReactMetrics = preserveCommandBuilder(
	cmd('cow-components-react-metrics')
		.desc('Collect cow-components-react metrics')
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

	await collectSameAsDashboardMetrics(baseCtx, 'react');

	await createEmptyBundle(baseCtx, 'react');

	await collectEmptyBundleMetrics(baseCtx, 'react');

	await exec('? Installing dependencies');
	await exec(`yarn --cwd ${DEMO_DIR}`);

	await rimrafAsync(DEMO_METRICS_DIR);
	await fs.mkdirp(DEMO_METRICS_DIR);
	await exec('? Generating toggleable bundle');

	await exec('? Generating JS');
	await fs.mkdirp(DEMO_METRICS_TOGGLEABLE_DIR);
	const indexJsFilePath = path.join(DEMO_METRICS_TOGGLEABLE_DIR, 'index.tsx');
	const indexJsContent = await getRenderTimeJsTemplate();
	await fs.writeFile(indexJsFilePath, indexJsContent, 'utf8');

	await exec('? Generating HTML');
	const indexHtmlFilePath = path.join(
		DEMO_METRICS_TOGGLEABLE_DIR,
		'index.html'
	);
	const indexHtmlContent = await getRenderTimeHTMLTemplate();
	await fs.writeFile(indexHtmlFilePath, indexHtmlContent, 'utf8');

	await exec('? Copying CSS');
	await fs.copy(
		path.join(DEMO_DIR, 'packages/react/styles/cow-components.css'),
		path.join(DEMO_METRICS_TOGGLEABLE_DIR, 'index.css')
	);

	await exec('? Bundling');
	await exec(
		`esbuild ${indexJsFilePath} --bundle --minify --outfile=${path.join(
			DEMO_METRICS_TOGGLEABLE_DIR,
			'index.bundle.js'
		)} --define:process.env.NODE_ENV=\\"production\\"`
	);

	await exec('? Collecting render time metrics');
	await baseCtx(
		`${TS_NODE_COMMAND} ${path.join(BASE_DIR, `render-time.ts`)}`
	);
});
