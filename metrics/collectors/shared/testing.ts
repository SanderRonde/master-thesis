export function assert(condition: boolean, str: string): asserts condition {
	if (!condition) {
		throw new Error(`Assertion did not hold: ${str}`);
	}
}
