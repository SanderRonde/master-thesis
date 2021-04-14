import { runFunctionIfCalledFromScript } from '../../shared/helpers';
import { storeData } from '../../shared/storage';
import { RenderTime } from '../../shared/types';
import { getRenderTime } from '../../shared/render-time';
import { ComponentFiles, getComponents } from '../dashboard/lib/get-components';
import { STORE_NAME } from './lib/constants';
import { NATIVE_DEMO_METRICS_TOGGLEABLE_DIR } from '../../../scripts/metrics/bundles/cow-components/cow-components-native';

interface ExtendedWindow extends Window {
	setVisibleComponent(componentName: string, visible: boolean): void;
}

declare const window: ExtendedWindow;

export async function getDashboardRenderTime(
	components: ComponentFiles[]
): Promise<RenderTime> {
	return await getRenderTime({
		getComponents: () => components.map((c) => c.js.componentName),
		sourceRoot: NATIVE_DEMO_METRICS_TOGGLEABLE_DIR,
		showComponent: async (component, page) => {
			await page.evaluate((componentName) => {
				window.setVisibleComponent(componentName, true);
			}, component);
		},
		hideComponent: async (component, page) => {
			await page.evaluate((componentName) => {
				window.setVisibleComponent(componentName, false);
			}, component);
		},
	});
}

runFunctionIfCalledFromScript(async () => {
	const components = await getComponents();
	await storeData(
		['metrics', 'cow-components-basic', STORE_NAME, 'render-time'],
		await getDashboardRenderTime(components)
	);
	process.exit(0);
}, __filename);
