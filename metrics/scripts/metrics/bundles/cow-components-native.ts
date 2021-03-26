import { cmd, flag, setEnvVar } from 'makfy';

import { preserveCommandBuilder } from '../../lib/makfy-helper';
import {
	collectEmptyBundleMetrics,
	collectSameAsDashboardMetrics,
	createEmptyBundle,
} from '../../lib/cow-components-shared';

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
});
