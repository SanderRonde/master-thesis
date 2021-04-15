import * as path from 'path';
import * as fs from 'fs-extra';

import { getRenderTimeIndexJsTemplate } from './templates/render-time-index-js-template';
import { rimrafAsync } from '../../helpers';
import { registerSetupCommand } from '../../makfy-helper';
import { getRenderTimeIndexHTMLTemplate } from './templates/render-time-index-html-template';
import { getRenderTimeSvelteTemplate } from './templates/render-time-svelte-template';
import { writeFile } from '../../../../collectors/shared/files';

export function getSvelteCowComponentsDirs(baseDir: string) {
	const demoRepoDir = path.join(baseDir, 'dist/demo-repo');
	const svelteDemoDir = path.join(demoRepoDir, 'svelte');
	const demoMetricsDir = path.join(svelteDemoDir, 'metrics');
	const toggleableDir = path.join(demoMetricsDir, 'toggleable');

	return {
		demoRepoDir,
		svelteDemoDir,
		demoMetricsDir,
		toggleableDir,
	};
}

export function createSvelteSetupCommand(commandName: string, baseDir: string) {
	const {
		demoMetricsDir,
		svelteDemoDir,
		toggleableDir,
	} = getSvelteCowComponentsDirs(baseDir);

	return registerSetupCommand(commandName).run(async (exec) => {
		await rimrafAsync(demoMetricsDir);
		await exec('? Generating toggleable bundle');

		await exec('? Generating index JS');
		const indexJsFilePath = path.join(toggleableDir, 'index.ts');
		const indexJsContent = await getRenderTimeIndexJsTemplate();
		await writeFile(indexJsFilePath, indexJsContent);

		await exec('? Generating index HTML');
		const indexHtmlFilePath = path.join(toggleableDir, 'index.html');
		const indexHtmlContent = await getRenderTimeIndexHTMLTemplate();
		await writeFile(indexHtmlFilePath, indexHtmlContent);

		await exec('? Generating Svelte');
		const sveltePath = path.join(toggleableDir, 'App.svelte');
		const svelteContent = await getRenderTimeSvelteTemplate();
		await writeFile(sveltePath, svelteContent);

		await exec('? Copying CSS');
		await fs.copy(
			path.join(
				svelteDemoDir,
				'packages/svelte/styles/cow-components.css'
			),
			path.join(toggleableDir, 'index.css')
		);

		await exec('? Bundling');
		await exec(
			`rollup -c ${path.join(__dirname, '../lib/', 'rollup.config.js')}`
		);
	});
}
