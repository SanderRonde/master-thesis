import { cmd, flag, setEnvVar } from 'makfy';
import * as path from 'path';
import * as fs from 'fs-extra';

import { preserveCommandBuilder } from '../../lib/makfy-helper';
import {
	collectSameAsDashboardMetrics,
	collectEmptyBundleMetrics,
	createEmptyBundle,
	DEMO_REPO_DIR,
} from '../../lib/cow-components-shared';
import { METRICS_DIR } from '../../../collectors/shared/constants';
import { rimrafAsync, TS_NODE_COMMAND } from '../../lib/helpers';
import { getRenderTimeIndexJsTemplate } from '../../../collectors/cow-components-svelte/templates/render-time-index-js-template';
import { getRenderTimeIndexHTMLTemplate } from '../../../collectors/cow-components-svelte/templates/render-time-index-html-template';
import { getRenderTimeSvelteTemplate } from '../../../collectors/cow-components-svelte/templates/render-time-svelte-template';
import { writeFile } from '../../../collectors/shared/files';

export const SVELTE_DEMO_DIR = path.join(DEMO_REPO_DIR, 'svelte');
const DEMO_METRICS_DIR = path.join(SVELTE_DEMO_DIR, 'metrics');
export const SVELTE_DEMO_METRICS_TOGGLEABLE_DIR = path.join(
	DEMO_METRICS_DIR,
	'toggleable'
);
const BASE_DIR = path.join(METRICS_DIR, `collectors/cow-components-svelte`);

export const cowComponentsSvelteMetrics = preserveCommandBuilder(
	cmd('cow-components-svelte-metrics')
		.desc('Collect cow-components-svelte metrics')
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

	await collectSameAsDashboardMetrics(baseCtx, 'svelte');

	await createEmptyBundle(baseCtx, 'svelte');

	await collectEmptyBundleMetrics(baseCtx, 'svelte');

	await exec('? Installing dependencies');
	await exec(`yarn --cwd ${SVELTE_DEMO_DIR}`);

	await rimrafAsync(DEMO_METRICS_DIR);
	await exec('? Generating toggleable bundle');

	await exec('? Generating index JS');
	const indexJsFilePath = path.join(
		SVELTE_DEMO_METRICS_TOGGLEABLE_DIR,
		'index.ts'
	);
	const indexJsContent = await getRenderTimeIndexJsTemplate();
	await writeFile(indexJsFilePath, indexJsContent);

	await exec('? Generating index HTML');
	const indexHtmlFilePath = path.join(
		SVELTE_DEMO_METRICS_TOGGLEABLE_DIR,
		'index.html'
	);
	const indexHtmlContent = await getRenderTimeIndexHTMLTemplate();
	await writeFile(indexHtmlFilePath, indexHtmlContent);

	await exec('? Generating Svelte');
	const sveltePath = path.join(
		SVELTE_DEMO_METRICS_TOGGLEABLE_DIR,
		'App.svelte'
	);
	const svelteContent = await getRenderTimeSvelteTemplate();
	await writeFile(sveltePath, svelteContent);

	await exec('? Copying CSS');
	await fs.copy(
		path.join(SVELTE_DEMO_DIR, 'packages/svelte/styles/cow-components.css'),
		path.join(SVELTE_DEMO_METRICS_TOGGLEABLE_DIR, 'index.css')
	);

	await exec('? Bundling');
	await exec(
		`rollup -c ${path.join(BASE_DIR, 'lib/render-time/rollup.config.js')}`
	);

	await exec('? Collecting render time metrics');
	await baseCtx(
		`${TS_NODE_COMMAND} ${path.join(BASE_DIR, `render-time.ts`)}`
	);
});
