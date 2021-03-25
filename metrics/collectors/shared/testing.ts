export function assert(condition: boolean, str: string) {
	if (!condition) {
		throw new Error(`Assertion did not hold: ${str}`);
	}
}
