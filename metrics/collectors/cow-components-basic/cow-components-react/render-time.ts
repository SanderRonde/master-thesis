import { runFunctionIfCalledFromScript } from '../../shared/helpers';
import { storeData } from '../../shared/storage';
import { RenderTime } from '../../shared/types';
import { getRenderTime } from '../../shared/render-time';
import { ComponentFiles, getComponents } from '../dashboard/lib/get-components';
import { STORE_NAME } from './lib/constants';
import { REACT_DEMO_METRICS_TOGGLEABLE_DIR } from '../../../scripts/metrics/bundles/cow-components/cow-components-react';

interface ExtendedWindow extends Window {
	setVisibleComponent(componentName: string | null): void;
}

declare const window: ExtendedWindow;

export async function getDashboardRenderTime(
	components: ComponentFiles[]
): Promise<RenderTime> {
	return await getRenderTime({
		getComponents: () => components.map((c) => c.js.componentName),
		sourceRoot: REACT_DEMO_METRICS_TOGGLEABLE_DIR,
		showComponent: async (component, page) => {
			await page.evaluate((componentName) => {
				window.setVisibleComponent(componentName);
			}, component);
		},
		hideComponent: async (_component, page) => {
			await page.evaluate(() => {
				window.setVisibleComponent(null);
			});
		},
	});
}

runFunctionIfCalledFromScript(async () => {
	const components = await getComponents();
	await storeData(
		['metrics', 'cow-components', STORE_NAME, 'render-time'],
		await getDashboardRenderTime(components)
	);
	process.exit(0);
}, __filename);
