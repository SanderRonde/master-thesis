export const chartRandomTemplate = `private _randomBetween = (() => {
	const lastResults: Map<number, number> = new Map();
	return (lowerBound: number, upperBound: number): number => {
		const diff = upperBound - lowerBound;
		if (!lastResults.has(diff)) {
			lastResults.set(diff, 0);
		}
		const num = (lastResults.get(diff) + 1) % diff;
		lastResults.set(diff, num);

		return lowerBound + num;
	};
})();`