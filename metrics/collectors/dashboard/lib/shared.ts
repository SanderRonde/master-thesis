import { sortObjectKeys } from '../../shared/helpers';
import { DatasetStats, getDatasetStats } from '../../shared/stats';
import { ComponentFiles, getComponents, ReadFile } from './get-components';

export async function collectDashboardMetrics<A>(
	getFileMetrics: (file: ReadFile, ...args: A[]) => number | Promise<number>,
	getArgs?: (components: ComponentFiles[]) => A[] | Promise<A[]>
): Promise<{
	files: Record<string, number>;
	stats: DatasetStats;
}> {
	const components = await getComponents();
	const args = (await getArgs?.(components)) || [];

	const data: Record<string, number> = {};
	await Promise.all(
		components.map(async (component) => {
			data[component.js.componentName] = await getFileMetrics(
				component.js,
				...args
			);
		})
	);

	const stats = getDatasetStats(Object.values(data));
	return {
		files: sortObjectKeys(data),
		stats,
	};
}
