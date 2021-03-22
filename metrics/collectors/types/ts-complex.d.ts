declare module 'ts-complex' {
	export interface Maintainability {
		averageMaintainability: number;
		minMaintainability: number;
	}

	export function calculateMaintainability(filePath: string): Maintainability;
	export function calculateHalstead(filePath: string): Record<string, number>;
	export function calculateCyclomaticComplexity(
		filePath: string
	): Record<string, number>;
}

declare module 'ts-complex/lib/src/services/sloc.service' {
	export function calculate(sourceCode: string): number;
}
