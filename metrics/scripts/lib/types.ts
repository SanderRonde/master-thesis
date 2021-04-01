import { CommandBuilder } from 'makfy/dist/lib/schema/commands';
import { METRICS_COMMAND_ARGS } from './makfy-helper';

export type ConstArrItems<T> = T[Extract<keyof T, number>];

export type ParallelBundleMap<B extends string> = {
	[K in B]?: CommandBuilder<typeof METRICS_COMMAND_ARGS>;
};

export type SerialBundleMap<B extends string> = {
	[K in B]: CommandBuilder<typeof METRICS_COMMAND_ARGS>;
};
