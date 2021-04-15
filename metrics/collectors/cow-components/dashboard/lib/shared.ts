import { ComponentFiles, ReadFile } from '../../../metric-definitions/types';
import { collectBundleMetrics } from '../../../shared/cow-components-shared';
import { DatasetStats } from '../../../shared/stats';
import { getComponents } from './get-components';

export async function collectDashboardMetrics<A>(
	getFileMetrics: (file: ReadFile, args: A) => number | Promise<number>,
	getArgs?: (components: ComponentFiles[]) => A | Promise<A>
): Promise<{
	components: Record<string, number>;
	stats: DatasetStats;
}> {
	return collectBundleMetrics(await getComponents(), getFileMetrics, getArgs);
}
