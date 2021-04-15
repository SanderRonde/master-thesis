import {
	getCowComponents,
	getMatchingComponent,
} from '../../../../submodules/30mhz-dashboard/src/lib/web-components/scripts/lib/get-cow-components';
import { ComponentFiles } from '../../../metric-definitions/types';

export const EXCLUDED_COMPONENTS = [
	'LineChartComponent',
	'PopupsComponent',
	'ToastNotificationComponent',
	'PopupComponent',
	'ToastComponent',
	'ThemeProviderComponent',
	'FireworksComponent',
	'ChartErrorComponent',
];

export async function getComponents(): Promise<ComponentFiles[]> {
	const componentFiles = (await getCowComponents('src')).filter(
		(c) => !EXCLUDED_COMPONENTS.includes(c.componentName)
	);

	const templateFiles = await getCowComponents('src', 'html');

	return componentFiles.map((componentFile) => {
		return {
			js: componentFile,
			html: getMatchingComponent(componentFile, templateFiles),
		};
	});
}
