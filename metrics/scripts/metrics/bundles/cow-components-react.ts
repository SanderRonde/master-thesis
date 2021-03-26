import { cmd, flag, setEnvVar } from 'makfy';

import { preserveCommandBuilder } from '../../lib/makfy-helper';
import {
	collectSameAsDashboardMetrics,
	createEmptyBundle,
	collectEmptyBundleMetrics,
} from '../../lib/cow-components-shared';

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
});
