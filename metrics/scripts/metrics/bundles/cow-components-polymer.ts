import * as path from 'path';
import { cmd, flag, setEnvVar } from 'makfy';

import { METRICS_DIR } from '../../../collectors/shared/constants';
import { preserveCommandBuilder } from '../../lib/makfy-helper';
import { TS_NODE_COMMAND } from '../../lib/helpers';
import { SAME_AS_DASHBOARD_METRICS } from '../../lib/cow-components-shared';

const BASE_DIR = path.join(METRICS_DIR, `collectors/cow-components-polymer`);

export const cowComponentsPolymerMetrics = preserveCommandBuilder(
	cmd('cow-components-polymer-metrics')
		.desc('Collect cow-components-polymer metrics')
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

	await exec('? Collecting same-as-dashboard metrics');
	await Promise.all(SAME_AS_DASHBOARD_METRICS.map((metric) => {
		return baseCtx(`${TS_NODE_COMMAND} ${path.join(BASE_DIR, `${metric}.ts`)}`);
	}));
});
