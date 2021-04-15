import * as path from 'path';

import { runFunctionIfCalledFromScript } from '../../shared/helpers';
import { storeData } from '../../shared/storage';
import { RenderTime } from '../../shared/types';
import { getRenderTime } from '../../metric-definitions/render-time';
import { getComponents } from '../dashboard/lib/get-components';
import { STORE_NAME } from './lib/constants';
import { SET_RENDER_OPTION_FUNCTION_NAME } from '../dashboard/lib/render-time/templates/set-render-option';
import { ANGULAR_DEMO_DIR } from '../../../scripts/metrics/bundles/cow-components/cow-components-angular';
import { duplicateRenderTimeKeys } from '../dashboard/lib/shared';
import { ComponentFiles } from '../../metric-definitions/types';

interface AppRootElement extends HTMLElement {
	[SET_RENDER_OPTION_FUNCTION_NAME]: (name: string, value: boolean) => void;
}

export async function getDashboardRenderTime(
	components: ComponentFiles[]
): Promise<RenderTime> {
	return await getRenderTime({
		getComponents: () => components.map((c) => c.js.componentName),
		sourceRoot: path.join(ANGULAR_DEMO_DIR, 'dist/angular-demo'),
		showComponent: async (component, page) => {
			await page.$eval(
				'app-root',
				(element, componentName) => {
					(element as AppRootElement).setRenderOption(
						componentName as string,
						true
					);
				},
				component
			);
		},
	});
}

runFunctionIfCalledFromScript(async () => {
	const components = await getComponents();
	await storeData(
		['metrics', 'cow-components-basic', STORE_NAME, 'render-time'],
		duplicateRenderTimeKeys(await getDashboardRenderTime(components))
	);
	process.exit(0);
}, __filename);
