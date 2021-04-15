import { runFunctionIfCalledFromScript } from '../../shared/helpers';
import { storeData } from '../../shared/storage';
import { RenderTime } from '../../shared/types';
import { getRenderTime } from '../../metric-definitions/render-time';
import { getComponents } from '../dashboard/lib/get-components';
import { STORE_NAME } from './lib/constants';
import { REACT_DEMO_METRICS_TOGGLEABLE_DIR } from '../../../scripts/metrics/bundles/cow-components/cow-components-react';
import { duplicateRenderTimeKeys } from '../dashboard/lib/shared';
import { ComponentFiles } from '../../metric-definitions/types';

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
