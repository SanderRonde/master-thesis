const __COW_COMPONENTS_WRAPPERS = [
	'angular',
	'react',
	'native',
	'vue2',
	'vue3',
	'polymer',
	'lit-element',
	'svelte',
] as const;
export type CowComponentsWrapper = typeof __COW_COMPONENTS_WRAPPERS[Extract<
	keyof typeof __COW_COMPONENTS_WRAPPERS,
	number
>];
const COW_COMPONENTS_WRAPPERS = (__COW_COMPONENTS_WRAPPERS as unknown) as CowComponentsWrapper[];

const __BUNDLES = [
	'dashboard',
	...COW_COMPONENTS_WRAPPERS.map(
		(wrapper) => `cow-components-${wrapper}` as const
	),
] as const;
const __METRICS = [
	'structural-complexity',
	'cyclomatic-complexity',
	'lines-of-code',
	'maintainability',
	'load-time',
	'size',
	'number-of-components',
	'render-time',
] as const;
export type Bundle = typeof __BUNDLES[Extract<keyof typeof __BUNDLES, number>];
export type Metric = typeof __METRICS[Extract<keyof typeof __METRICS, number>];

export const BUNDLES = (__BUNDLES as unknown) as Bundle[];

export const METRICS = (__METRICS as unknown) as Metric[];
