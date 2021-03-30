import * as path from 'path';
import * as fs from 'fs-extra';

import { CACHE_DIR } from './constants';
import { specialJSONParse, specialJSONStringify } from './special-json';
import { readFile, writeFile } from './files';

export async function useCache<R>(
	name: string,
	fn: () => R | Promise<R>,
	disableCache: boolean = false
): Promise<R> {
	const cacheFile = path.join(CACHE_DIR, `${name}.json`);
	if ((await fs.pathExists(cacheFile)) && !disableCache) {
		return specialJSONParse(await readFile(cacheFile));
	}

	const result = await fn();
	await writeFile(cacheFile, specialJSONStringify(result));
	return result;
}
