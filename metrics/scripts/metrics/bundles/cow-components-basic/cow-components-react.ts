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
import { rimrafAsync, TS_NODE_COMMAND } from '../../../lib/helpers';
import { getRenderTimeJsTemplate } from '../../../../collectors/cow-components-basic/cow-components-react/templates/render-time-js-template';
import { getRenderTimeHTMLTemplate } from '../../../../collectors/cow-components-basic/cow-components-react/templates/render-time-html-template';
import { METRICS_DIR } from '../../../../collectors/shared/constants';
import { writeFile } from '../../../../collectors/shared/files';

const DEMO_DIR = path.join(DEMO_REPO_DIR_BASIC, 'react');
const DEMO_METRICS_DIR = path.join(DEMO_DIR, 'metrics');
export const REACT_DEMO_METRICS_TOGGLEABLE_DIR = path.join(
	DEMO_METRICS_DIR,
	'toggleable'
);
const BASE_DIR = path.join(
	METRICS_DIR,
	`collectors/cow-components-basic/cow-components-react`
);

export const cowComponentsReactInstall = registerInstallCommand(
	'cow-components-basic-react'
).run(async (exec) => {
	await exec('? Installing dependencies');
	await exec(`yarn --cwd ${DEMO_DIR} || yarn --cwd ${DEMO_DIR} || yarn --cwd ${DEMO_DIR}`);
});

export const cowComponentsReactSetup = registerSetupCommand(
	'cow-components-basic-react'
).run(async (exec) => {
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
});

export const cowComponentsReactMetrics = registerMetricsCommand(
	'cow-components-react'
).run(async (exec) => {
	await collectSameAsDashboardBasicMetrics(exec, 'react');

	await exec('? Collecting bundle metadata metrics');
	await exec(`${TS_NODE_COMMAND} ${path.join(BASE_DIR, `load-time.ts`)}`);
	await exec(`${TS_NODE_COMMAND} ${path.join(BASE_DIR, `size.ts`)}`);

	await exec('? Collecting render time metrics');
	await exec(`${TS_NODE_COMMAND} ${path.join(BASE_DIR, `render-time.ts`)}`);
});
