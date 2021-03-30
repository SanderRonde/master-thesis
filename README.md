# Master thesis

## Results

The latest results (as of now) can be found [over here](https://github.com/SanderRonde/master-thesis/blob/master/metrics/data/database.json). The format of the data is the following:

```ts
interface DatasetStats {
	min: number;
	max: number;
	avg: number;
	total: number;
	median: number;
	stddev: number;
}

interface ByComponentNumberStats = {
	components: {
		[componentName: string]: number;
	};
	stats: DatasetStats;
};

type Bundles = 'dashboard'
	|'cow-components-angular'
	|'cow-components-native'
	|'cow-components-react'
	|'cow-components-svelte';

type Data = {
	metrics: {
		[bundleName in Bundles]: {
			'lines-of-code': ByComponentNumberStats;
			'cyclomatic-complexity': ByComponentNumberStats;
			'maintainability': {
				'averageMaintainability': number;
				'minMaintainability': number;
			};
			'structural-complexity': ByComponentNumberStats;
			'size': number;
			'load-time': {
				'values': number[];
				'stats': DatasetStats;
			};
			'number-of-components': number;
			'render-time': {
				components: {
					[componentName: string]: {
						times: number[];
						stats: DatasetStats;
					};
				}
				stats: DatasetStats;
			}
		};
	};
};
```
