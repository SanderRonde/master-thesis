import { Maintainability } from 'ts-complex';
import { Bundle } from '../../scripts/lib/constants';
import { DatasetStats } from './stats';

type ByComponentNumberStats = {
	components: Record<string, number>;
	stats: DatasetStats;
};
export type ComponentRenderTimeData = {
	times: number[];
	stats: DatasetStats;
};
export type StructuralComplexity = ByComponentNumberStats;
export type CyclomaticComplexity = ByComponentNumberStats;
export type LinesOfCode = ByComponentNumberStats;
export type Size = number;
export type NumberOfComponents = number;
export type LoadTime = {
	values: number[];
	stats: DatasetStats;
};
export type RenderTime = {
	components: Record<string, ComponentRenderTimeData>;
	stats: DatasetStats;
};

export interface Data {
	metrics: {
		[bundle in Bundle]: {
			'lines-of-code': LinesOfCode;
			'cyclomatic-complexity': CyclomaticComplexity;
			maintainability: Maintainability;
			'structural-complexity': StructuralComplexity;
			size: Size;
			'load-time': LoadTime;
			'number-of-components': NumberOfComponents;
			'render-time': RenderTime
		};
	};
}
