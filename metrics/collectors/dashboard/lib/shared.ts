import { sortObjectKeys } from '../../shared/helpers';
import { ComponentFiles, getComponents, ReadFile } from './get-components';

export async function collectDashboardMetrics<R, A>(
	getFileMetrics: (file: ReadFile, ...args: A[]) => R | Promise<R>,
	getArgs?: (components: ComponentFiles[]) => A[] | Promise<A[]>
): Promise<Record<string, R>> {
	const components = await getComponents();
	const args = (await getArgs?.(components)) || [];

	const data: Record<string, R> = {};
	await Promise.all(
		components.map(async (component) => {
			data[component.js.componentName] = await getFileMetrics(
				component.js,
				...args
			);
		})
	);

	return sortObjectKeys(data);
}
