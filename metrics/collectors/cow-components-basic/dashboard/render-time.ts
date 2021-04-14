import { runFunctionIfCalledFromScript } from '../../shared/helpers';
import { storeData } from '../../shared/storage';
import { ComponentFiles, getComponents } from './lib/get-components';
import { RenderTime } from '../../shared/types';
import { getRenderTime } from '../../shared/render-time';
import { DASHBOARD_DIST_DIR } from './lib/constants';
import { COMPONENT_NAME_MAP } from './lib/shared';

interface NGElement {
	__ngContext__: any[];
}

export async function getDashboardRenderTime(
	components: ComponentFiles[]
): Promise<RenderTime> {
	return await getRenderTime({
		getComponents: () => components.map((c) => c.js.componentName),
		sourceRoot: DASHBOARD_DIST_DIR,
		urlPath: '/404',
		showComponent: async (component, page) => {
			await page.$eval(
				'page-not-found',
				(element, componentName) => {
					((element as unknown) as NGElement).__ngContext__
						.find(
							(c) =>
								c &&
								typeof c === 'object' &&
								'setRenderOption' in c
						)
						.setRenderOption(componentName, true);
				},
				component
			);
		},
		hideComponent: async (component, page) => {
			await page.$eval(
				'page-not-found',
				(element, componentName) => {
					((element as unknown) as NGElement).__ngContext__
						.find(
							(c) =>
								c &&
								typeof c === 'object' &&
								'setRenderOption' in c
						)
						.setRenderOption(componentName, false);
				},
				component
			);
		},
	});
}

runFunctionIfCalledFromScript(async () => {
	const components = await getComponents();
	const data = await getDashboardRenderTime(components);
	for (const componentName in data.components) {
		if (COMPONENT_NAME_MAP.has(componentName)) {
			data.components[COMPONENT_NAME_MAP.get(componentName) as any] =
				data.components[componentName];
		}
	}
	await storeData(
		['metrics', 'cow-components-basic', 'dashboard-basic', 'render-time'],
		data
	);
	process.exit(0);
}, __filename);
