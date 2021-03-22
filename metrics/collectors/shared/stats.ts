import { sum } from './helpers';

export interface DatasetStats {
	min: number;
	max: number;
	avg: number;
	total: number;
	median: number;
	stddev: number;
}

function standardDeviation(numbers: number[]): number {
	const avg = sum(numbers) / numbers.length;

	var stddevTotal = 0;
	for (let i = 0; i < numbers.length; i++) {
		stddevTotal += Math.pow(numbers[i] - avg, 2);
	}
	var stddev = Math.sqrt(stddevTotal / numbers.length);
	return stddev;
}

export function getDatasetStats(dataset: number[]): DatasetStats {
	const total = sum(dataset);
	const sorted = [...dataset].sort();
	const half = dataset.length / 2;
	return {
		min: Math.min(...dataset),
		max: Math.max(...dataset),
		avg: total / dataset.length,
		total,
		median:
			dataset.length % 2 === 0
				? sorted[half]
				: (sorted[Math.floor(half)] + sorted[Math.ceil(half)]) / 2,
		stddev: standardDeviation(dataset),
	};
}
