import { cmd } from 'makfy';
import { DASHBOARD_DIR } from '../../../collectors/shared/constants';
import { preserveCommandBuilder } from '../../lib/makfy-helper';

export const dashboardDemo = preserveCommandBuilder(
	cmd('dashboard-demo').desc('Build the 30MHz dashboard demo')
).run(async (exec) => {
	await exec(
		`yarn --cwd ${DASHBOARD_DIR} webcomponents.design-library-demo-repo --build-demos`
	);
});
