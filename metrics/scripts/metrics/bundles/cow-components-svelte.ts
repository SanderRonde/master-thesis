import { cmd, flag, setEnvVar } from 'makfy';

import { preserveCommandBuilder } from '../../lib/makfy-helper';
import {
	collectSameAsDashboardMetrics,
	collectEmptyBundleMetrics,
	createEmptyBundle,
} from '../../lib/cow-components-shared';

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
});
