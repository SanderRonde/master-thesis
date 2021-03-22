import * as fs from 'fs-extra';
import * as path from 'path';

import { METRICS_DIR } from './constants';

const DEFAULT_STORE_NAME = 'database';
const STORAGE_DIR = path.join(METRICS_DIR, 'data');

async function readStore(storeName: string): Promise<any | null> {
	const storeFileName = path.join(STORAGE_DIR, `${storeName}.json`);
	if (!(await fs.pathExists(storeFileName))) {
		return null;
	}
	const data = await fs.readFile(storeFileName, {
		encoding: 'utf8',
	});
	return JSON.parse(data);
}

async function writeStore(storeName: string, data: any) {
	const storeFileName = path.join(STORAGE_DIR, `${storeName}.json`);
	await fs.mkdirp(path.dirname(storeFileName));
	await fs.writeFile(storeFileName, JSON.stringify(data, null, '\t'), {
		encoding: 'utf8',
	});
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
	const store = (await readStore(storeName)) || {};
	debugger;
	console.log(store, key, value);

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

	console.log(currentStore)

	await writeStore(storeName, store);
}
