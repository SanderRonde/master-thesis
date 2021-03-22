declare module 'ts-complex' {
	export interface Maintainability {
		averageMaintainability: number;
		minMaintainability: number;
	}

	export interface HalsteadComplexity {
		length: number;
		vocabulary: number;
		volume: number;
		difficulty: number;
		effort: number;
		time: number;
		bugsDelivered: number;
		operands: {
			total: number;
			unique: number;
		};
		operators: {
			total: number;
			unique: number;
		};
	}

	export function calculateMaintainability(filePath: string): Maintainability;
	export function calculateHalstead(
		filePath: string
	): Record<string, HalsteadComplexity> | Record<string, never>;
	export function calculateCyclomaticComplexity(
		filePath: string
	): Record<string, number>;
}

declare module 'ts-complex/lib/src/services/sloc.service' {
	export function calculate(sourceCode: string): number;
}
