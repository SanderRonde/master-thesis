import { Maintainability } from 'ts-complex';
import { Bundle } from '../../scripts/lib/constants';
import { DatasetStats } from './stats';

type ByFileNumberStats = {
	files: Record<string, number>;
	stats: DatasetStats;
};
export type FileRenderTimeData = {
	times: number[];
	stats: DatasetStats;
};
export type StructuralComplexity = ByFileNumberStats;
export type CyclomaticComplexity = ByFileNumberStats;
export type LinesOfCode = ByFileNumberStats;
export type HalsteadComplexity = ByFileNumberStats;
export type Size = number;
export type NumberOfComponents = number;
export type LoadTime = {
	values: number[];
	stats: DatasetStats;
};
export type RenderTime = {
	files: Record<string, FileRenderTimeData>;
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
		};
	};
}
