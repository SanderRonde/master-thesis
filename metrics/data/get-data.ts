import { fromEntries } from '../collectors/shared/helpers';
import { DatasetStats, getDatasetStats } from '../collectors/shared/stats';
import { DEFAULT_STORE_NAME, readStore } from '../collectors/shared/storage';
import { Data, BundleData } from '../collectors/shared/types';
import { Bundle, Framework } from '../scripts/lib/constants';
import { flatten } from '../submodules/30mhz-dashboard/src/lib/web-components/src/api/helpers';

export type DataByFramework = Data['metrics'];
export type DataByBundle = {
	[B in Bundle]: BundleData & {
		framework: Framework;
	};
};

export interface ParsedData {
	byFramework: DataByFramework;
	byBundle: DataByBundle;
	bundleArr: (BundleData & {
		framework: Framework;
		bundle: Bundle;
	})[];
	baseComponentRenderTimes: {
		framework: Framework;
		bundle: Bundle;
		stats: DatasetStats;
	}[];
}

export async function getData(
	storeName: string = DEFAULT_STORE_NAME
): Promise<Partial<ParsedData>> {
	const data = (await readStore(storeName)) as Data;

	const bundleArr = flatten(
		Object.entries(data.metrics).map(([framework, byBundle]) => {
			return Object.entries(byBundle).map(([bundleName, bundle]) => {
				return {
					...bundle,
					framework: framework as Framework,
					bundle: bundleName as Bundle,
				};
			});
		})
	);
	return {
		byFramework: data.metrics,
		byBundle: fromEntries(
			bundleArr.map((fullBundle) => {
				const { bundle: bundleName, ...bundle } = fullBundle;
				return [bundleName, bundle];
			})
		) as DataByBundle,
		bundleArr,
		baseComponentRenderTimes: bundleArr.map((bundle) => {
			const componentStats = bundle['render-time'].components;

			if (
				!componentStats.Button ||
				!componentStats.Input ||
				!componentStats.Switch
			) {
				throw new Error(
					`Failed to find a base component for "${bundle.framework}.${bundle.bundle}"`
				);
			}
			return {
				framework: bundle.framework,
				bundle: bundle.bundle,
				stats: getDatasetStats([
					...componentStats.Button.times,
					...componentStats.Input.times,
					...componentStats.Switch.times,
				]),
			};
		}),
	};
}
