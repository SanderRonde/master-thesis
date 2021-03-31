import { cmd, flag, setEnvVar } from 'makfy';
import * as fs from 'fs-extra';
import * as path from 'path';

import { preserveCommandBuilder } from '../../lib/makfy-helper';
import {
	collectSameAsDashboardMetrics,
	DEMO_REPO_DIR,
} from '../../lib/cow-components-shared';
import { rimrafAsync, TS_NODE_COMMAND } from '../../lib/helpers';
import { getRenderTimeJsTemplate } from '../../../collectors/cow-components-react/templates/render-time-js-template';
import { getRenderTimeHTMLTemplate } from '../../../collectors/cow-components-react/templates/render-time-html-template';
import { METRICS_DIR } from '../../../collectors/shared/constants';
import { writeFile } from '../../../collectors/shared/files';

const DEMO_DIR = path.join(DEMO_REPO_DIR, 'react');
const DEMO_METRICS_DIR = path.join(DEMO_DIR, 'metrics');
export const REACT_DEMO_METRICS_TOGGLEABLE_DIR = path.join(
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

	await exec('? Installing dependencies');
	await exec(`yarn --cwd ${DEMO_DIR}`);

	await rimrafAsync(DEMO_METRICS_DIR);
	await exec('? Generating toggleable bundle');

	await exec('? Generating JS');
	const indexJsFilePath = path.join(
		REACT_DEMO_METRICS_TOGGLEABLE_DIR,
		'index.tsx'
	);
	const indexJsContent = await getRenderTimeJsTemplate();
	await writeFile(indexJsFilePath, indexJsContent);

	await exec('? Generating HTML');
	const indexHtmlFilePath = path.join(
		REACT_DEMO_METRICS_TOGGLEABLE_DIR,
		'index.html'
	);
	const indexHtmlContent = await getRenderTimeHTMLTemplate();
	await writeFile(indexHtmlFilePath, indexHtmlContent);

	await exec('? Copying CSS');
	await fs.copy(
		path.join(DEMO_DIR, 'packages/react/styles/cow-components.css'),
		path.join(REACT_DEMO_METRICS_TOGGLEABLE_DIR, 'index.css')
	);

	await exec('? Bundling');
	await exec(
		`esbuild ${indexJsFilePath} --bundle --minify --outfile=${path.join(
			REACT_DEMO_METRICS_TOGGLEABLE_DIR,
			'index.bundle.js'
		)} --define:process.env.NODE_ENV=\\"production\\"`
	);

	await exec('? Collecting bundle metadata metrics');
	await exec(`${TS_NODE_COMMAND} ${path.join(BASE_DIR, `load-time.ts`)}`);
	await exec(`${TS_NODE_COMMAND} ${path.join(BASE_DIR, `size.ts`)}`);

	await exec('? Collecting render time metrics');
	await baseCtx(
		`${TS_NODE_COMMAND} ${path.join(BASE_DIR, `render-time.ts`)}`
	);
});
