const TYPE_KEY = '___type___';

export function specialJSONStringify(value: any) {
	if (value instanceof Map) {
		return JSON.stringify({
			[TYPE_KEY]: 'map',
			value: [...value.entries()],
		});
	}
	if (value instanceof Set) {
		return JSON.stringify({
			[TYPE_KEY]: 'set',
			value: [...value.values()],
		});
	}
	if (value instanceof WeakMap || value instanceof WeakSet) {
		throw new Error('Weak values cannot be serialized');
	}
	return JSON.stringify(value);
}

export function specialJSONParse(str: string) {
	const parsed = JSON.parse(str);
	if (TYPE_KEY in parsed) {
		if (parsed[TYPE_KEY] === 'map') {
			return new Map(parsed.value);
		} else if (parsed[TYPE_KEY] === 'set') {
			return new Set(parsed.value);
		} else {
			throw new Error(`Unknown type ${parsed[TYPE_KEY]}`);
		}
	}
	return parsed;
}
