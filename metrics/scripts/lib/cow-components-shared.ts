import { ExecFunction } from 'makfy/dist/lib/schema/runtime';
import * as path from 'path';
import * as fs from 'fs-extra';

import { DASHBOARD_DIR, METRICS_DIR } from '../../collectors/shared/constants';
import { rimrafAsync, TS_NODE_COMMAND } from './helpers';

/**
 * Metrics that are the same between cow components
 * and the dashboard
 */
export const SAME_AS_DASHBOARD_METRICS = [
	'structural-complexity',
	'cyclomatic-complexity',
	'lines-of-code',
	'maintainability',
	'number-of-components',
] as const;

export const DEMO_REPO_DIR = path.join(DASHBOARD_DIR, 'dist/demo-repo');

export async function collectSameAsDashboardMetrics(
	exec: ExecFunction,
	frameworkName: string
) {
	const baseDir = path.join(
		METRICS_DIR,
		`collectors/cow-components-${frameworkName}`
	);

	await exec('? Collecting same-as-dashboard metrics');
	await Promise.all(
		SAME_AS_DASHBOARD_METRICS.map((metric) => {
			return exec(
				`${TS_NODE_COMMAND} ${path.join(baseDir, `${metric}.ts`)}`
			);
		})
	);
}

export async function createEmptyBundle(
	exec: ExecFunction,
	frameworkName: string
) {
	const DEMO_DIR = path.join(DEMO_REPO_DIR, frameworkName);
	const DEMO_METRICS_DIR = path.join(DEMO_DIR, 'metrics');
	const DEMO_METRICS_EMPTY_DIR = path.join(DEMO_METRICS_DIR, 'empty');

	await exec('? Installing dependencies');
	await exec(`yarn --cwd ${DEMO_DIR}`);

	await rimrafAsync(DEMO_METRICS_DIR);
	await fs.mkdirp(DEMO_METRICS_DIR);
	await exec('? Generating "empty" bundle');

	const indexJsFile = `import '../../packages/${frameworkName}'`;
	await fs.mkdirp(DEMO_METRICS_EMPTY_DIR);
	const emptyJsFilePath = path.join(DEMO_METRICS_EMPTY_DIR, 'index.js');
	await fs.writeFile(emptyJsFilePath, indexJsFile, 'utf8');
	await exec(
		`esbuild ${emptyJsFilePath} --bundle --minify --outfile=${path.join(
			DEMO_METRICS_EMPTY_DIR,
			'index.bundle.js'
		)} --define:process.env.NODE_ENV=\\"production\\"`
	);

	const indexHTMLFile = `<html><head></head><body><script src="index.bundle.js"></script></body></html>`;
	const emptyHTMLFilePath = path.join(DEMO_METRICS_EMPTY_DIR, 'index.html');
	await fs.writeFile(emptyHTMLFilePath, indexHTMLFile, 'utf8');
}

export async function collectEmptyBundleMetrics(
	exec: ExecFunction,
	frameworkName: string
) {
	const baseDir = path.join(
		METRICS_DIR,
		`collectors/cow-components-${frameworkName}`
	);

	await exec('? Collecting empty-bundle metrics');
	await exec(`${TS_NODE_COMMAND} ${path.join(baseDir, `load-time.ts`)}`);
	await exec(`${TS_NODE_COMMAND} ${path.join(baseDir, `size.ts`)}`);
}
