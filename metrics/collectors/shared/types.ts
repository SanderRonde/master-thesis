import { BundlesByFramework } from '../../scripts/lib/constants';
import { BaseComponent } from './shapes';
import { DatasetStats } from './stats';

type ByComponentNumberStats = {
	components: Record<string, number>;
	stats: DatasetStats;
};
export type ComponentRenderTimeData = Record<
	number,
	{
		times: number[];
		stats: DatasetStats;
	}
>;
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
	components: {
		[BC in BaseComponent]: ComponentRenderTimeData;
	} &
		Record<string, ComponentRenderTimeData>;
	stats: Record<number, DatasetStats>;
};
export type PageLoadTime = {
	'first-paint': {
		times: number[];
		stats: DatasetStats;
	};
	'first-contentful-paint': {
		times: number[];
		stats: DatasetStats;
	};
};

export interface BundleData {
	'is-css-framework': boolean;
	'lines-of-code': LinesOfCode;
	'cyclomatic-complexity': CyclomaticComplexity;
	maintainability: ByComponentNumberStats;
	'structural-complexity': StructuralComplexity;
	size: Size;
	'load-time': LoadTime;
	'number-of-components': NumberOfComponents;
	'render-time': RenderTime;
	'page-load-time': PageLoadTime;
}

export interface Data {
	metrics: {
		[Framework in keyof BundlesByFramework]: {
			[Bundle in BundlesByFramework[Framework]]: BundleData;
		};
	};
}
