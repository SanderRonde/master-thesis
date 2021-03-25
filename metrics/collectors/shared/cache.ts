import * as path from 'path';
import * as fs from 'fs-extra';

import { CACHE_DIR } from './constants';
import { specialJSONParse, specialJSONStringify } from './special-json';

export async function useCache<R>(
	name: string,
	fn: () => R | Promise<R>,
	disableCache: boolean = false
): Promise<R> {
	const cacheFile = path.join(CACHE_DIR, `${name}.json`);
	if ((await fs.pathExists(cacheFile)) && !disableCache) {
		return specialJSONParse(await fs.readFile(cacheFile, 'utf8'));
	}

	const result = await fn();
	await fs.mkdirp(path.dirname(cacheFile));
	await fs.writeFile(cacheFile, specialJSONStringify(result), 'utf8');
	return result;
}
