import * as path from 'path';

import { runFunctionIfCalledFromScript } from '../shared/helpers';
import { storeData } from '../shared/storage';
import { RenderTime } from '../shared/types';
import { getRenderTime } from '../shared/render-time';
import { ComponentFiles, getComponents } from '../dashboard/lib/get-components';
import { STORE_NAME } from './lib/constants';
import { ANGULAR_DEMO_DIR } from '../../scripts/metrics/bundles/cow-components-angular';
import { SET_RENDER_OPTION_FUNCTION_NAME } from '../dashboard/lib/render-time/templates/set-render-option';

interface AppRootElement extends HTMLElement {
	[SET_RENDER_OPTION_FUNCTION_NAME]: (name: string, value: boolean) => void;
}

export async function getDashboardRenderTime(
	components: ComponentFiles[]
): Promise<RenderTime> {
	return await getRenderTime({
		components,
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
				component.js.componentName
			);
		},
		hideComponent: async (component, page) => {
			await page.$eval(
				'app-root',
				(element, componentName) => {
					(element as AppRootElement).setRenderOption(
						componentName as string,
						false
					);
				},
				component.js.componentName
			);
		},
	});
}

runFunctionIfCalledFromScript(async () => {
	const components = await getComponents();
	await storeData(
		['metrics', STORE_NAME, 'render-time'],
		await getDashboardRenderTime(components)
	);
	process.exit(0);
}, __filename);
