import { runFunctionIfCalledFromScript } from '../../shared/helpers';
import { storeData } from '../../shared/storage';
import { getComponents } from './lib/get-components';
import { RenderTime } from '../../shared/types';
import { getRenderTime } from '../../metric-definitions/render-time';
import { DASHBOARD_DIST_DIR } from './lib/constants';
import { ComponentFiles } from '../../metric-definitions/types';

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
	});
}

runFunctionIfCalledFromScript(async () => {
	const components = await getComponents();
	await storeData(
		['metrics', 'cow-components', 'dashboard', 'render-time'],
		await getDashboardRenderTime(components)
	);
	process.exit(0);
}, __filename);
