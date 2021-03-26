import * as path from 'path';
import { cmd, flag, setEnvVar } from 'makfy';

import { METRICS_DIR } from '../../../collectors/shared/constants';
import { preserveCommandBuilder } from '../../lib/makfy-helper';
import { collectSameAsDashboardMetrics } from '../../lib/cow-components-shared';

const BASE_DIR = path.join(METRICS_DIR, `collectors/cow-components-angular`);

export const cowComponentsAngularMetrics = preserveCommandBuilder(
	cmd('cow-components-angular-metrics')
		.desc('Collect cow-components-angular metrics')
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

	await collectSameAsDashboardMetrics(baseCtx, 'angular');

	// For Angular we use the regular bundle for size and load-time
	// testing. This is because it will be excluded from the build
	// if not used. And the few bytes added should not make a big
	// difference
});
