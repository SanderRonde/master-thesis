import { CommandBuilder } from 'makfy/dist/lib/schema/commands';
import { METRICS_COMMAND_ARGS } from './makfy-helper';
import { LoadTimeMetricConfig } from './time-metrics';

export type ConstArrItems<T> = T[Extract<keyof T, number>];

export type CommandBuilderWithName<N> = CommandBuilder<
	typeof METRICS_COMMAND_ARGS
> & {
	__name: N;
};

export type NamedParallelBundleMap<B extends string> = {
	[K in B]?: CommandBuilderWithName<K>;
};

export type NamedSerialBundleMap<B extends string> = {
	[K in B]: CommandBuilderWithName<K>;
};

export type TimeMetricBundleMap<B extends string> = {
	[K in B]?: LoadTimeMetricConfig;
};

export type ParallelBundleMap<B extends string> = {
	[K in B]?: CommandBuilder<typeof METRICS_COMMAND_ARGS>;
};

export type SerialBundleMap<B extends string> = {
	[K in B]: CommandBuilder<typeof METRICS_COMMAND_ARGS>;
};
