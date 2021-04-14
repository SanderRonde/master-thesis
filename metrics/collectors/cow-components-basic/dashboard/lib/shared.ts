import { sortObjectKeys } from '../../../shared/helpers';
import { BASE_COMPONENT } from '../../../shared/shapes';
import { DatasetStats, getDatasetStats } from '../../../shared/stats';
import { ComponentFiles, getComponents, ReadFile } from './get-components';

/**
 * Add copies of the dashboard's equivalents of the
 * primary button, input and switch
 * components. This is basically just a rename
 * and allows us to just do `components.Button`
 * instead of `components.Button || components.PrimaryButtonComponent`
 */
export const COMPONENT_NAME_MAP = new Map<string, string>([
	['PrimaryButtonComponent', BASE_COMPONENT.BUTTON],
	['InputElement', BASE_COMPONENT.INPUT],
	['SwitchComponent', BASE_COMPONENT.SWITCH],
]);

export async function collectBundleMetrics<A>(
	components: ComponentFiles[],
	getFileMetrics: (file: ReadFile, ...args: A[]) => number | Promise<number>,
	getArgs?: (components: ComponentFiles[]) => A[] | Promise<A[]>
): Promise<{
	components: Record<string, number>;
	stats: DatasetStats;
}> {
	const args = (await getArgs?.(components)) || [];

	const data: Record<string, number> = {};
	await Promise.all(
		components.map(async (component) => {
			const metrics = await getFileMetrics(component.js, ...args);
			data[component.js.componentName] = metrics;
			if (COMPONENT_NAME_MAP.has(component.js.componentName)) {
				data[
					COMPONENT_NAME_MAP.get(component.js.componentName)!
				] = metrics;
			}
		})
	);

	const stats = getDatasetStats(Object.values(data));
	return {
		components: sortObjectKeys(data),
		stats,
	};
}

export async function collectDashboardMetrics<A>(
	getFileMetrics: (file: ReadFile, ...args: A[]) => number | Promise<number>,
	getArgs?: (components: ComponentFiles[]) => A[] | Promise<A[]>
): Promise<{
	components: Record<string, number>;
	stats: DatasetStats;
}> {
	return collectBundleMetrics(await getComponents(), getFileMetrics, getArgs);
}
