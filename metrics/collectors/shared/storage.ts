import * as fs from 'fs-extra';
import lockfile from 'proper-lockfile';
import * as path from 'path';

import { METRICS_DIR } from './constants';
import { debug } from './log';
import { DEVELOPMENT } from './settings';
import { readFile, writeFile } from './files';

const DEFAULT_STORE_NAME = 'database';
const STORAGE_DIR = path.join(METRICS_DIR, 'data');

async function readStore(storeName: string): Promise<any | null> {
	const storeFileName = path.join(STORAGE_DIR, `${storeName}.json`);
	if (!(await fs.pathExists(storeFileName))) {
		return null;
	}
	const data = await readFile(storeFileName);
	return JSON.parse(data);
}

async function writeStore(storeName: string, data: any) {
	const storeFileName = path.join(STORAGE_DIR, `${storeName}.json`);
	await writeFile(storeFileName, JSON.stringify(data, null, '\t'));
}

export async function getData<T>(
	key: string[],
	storeName: string = DEFAULT_STORE_NAME
): Promise<T | null> {
	const store = await readStore(storeName);
	if (!store) return null;

	let currentStore = store;
	let currentKey = key;

	while (currentKey.length && currentStore) {
		currentStore = currentStore[currentKey.shift()!];
	}

	if (currentKey.length) return null;
	return currentStore;
}

export async function storeData(
	key: string[],
	value: any,
	storeName: string = DEFAULT_STORE_NAME
): Promise<void> {
	if (DEVELOPMENT) {
		debug('storage', 'Not writing database in debug mode');
		debug('storage', `Setting "${key.join('.')}" to`, value);
		return;
	}

	const relaseLock = await lockfile.lock(
		path.join(STORAGE_DIR, `${storeName}.json`),
		{
			retries: 10,
		}
	);
	const store = (await readStore(storeName)) || {};

	let currentStore = store;
	let currentKey = key;

	if (currentKey.length === 0) {
		currentStore = value;
	}

	while (currentKey.length) {
		const nextKey = currentKey.shift()!;
		if (!currentStore[nextKey]) {
			currentStore[nextKey] = {};
		}

		if (currentKey.length === 0) {
			// Last key
			currentStore[nextKey] = value;
		}
		currentStore = currentStore[nextKey];
	}
	await writeStore(storeName, store);
	await relaseLock();
}
