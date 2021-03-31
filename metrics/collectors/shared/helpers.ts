import * as path from 'path';
import * as fs from 'fs-extra';
import glob from 'glob';
import { IOptions } from 'glob';

import { TEMP_DIR } from './constants';
import { error } from './log';

/**
 * Run given function if given file is the
 * file being called. Contrary to always running
 * given function, this makes sure that other
 * files importing this file does not trigger
 * the function to load.
 *
 * For example:
 * ```ts
 * function main() {
 * 	// ...
 * }
 *
 * main();
 * ```
 *
 * Here main will always run, both if called
 * as a script (`node my-script.js`) and when
 * imported (`import {} from './my-script`).
 * Since we only want scripts to run when they
 * are directly called, we use this function.
 */
export async function runFunctionIfCalledFromScript<R>(
	fn: () => R | Promise<R>,
	scriptFilePath: string
): Promise<R | void> {
	const calledScript = process.argv[1];

	if (path.resolve(calledScript) === path.resolve(scriptFilePath)) {
		try {
			return await fn();
		} catch (e) {
			error(scriptFilePath, `Script "${scriptFilePath}" failed`);
			console.error(e);

			// The version of node we use does not yet exit
			// on rejected promises. As such throwing an error
			// here won't do much. Instead, we need to exit
			// manually.
			// eslint-disable-next-line no-process-exit
			process.exit(1);
		}
	}
}

if (parseInt(process.version.split('.')[0], 10) <= 12) {
	process.on('unhandledRejection', (err) => {
		console.error(err);
		throw err;
	});
}

export function sortObjectKeys<O>(obj: O): O {
	const keys = Object.keys(obj).sort();
	return (Object.fromEntries(
		keys.map((key) => {
			const oKey = key as keyof O;
			return [oKey, obj[oKey]];
		})
	) as unknown) as O;
}

export function asyncGlob(
	pattern: string,
	options?: IOptions
): Promise<string[]> {
	return new Promise<string[]>((resolve, reject) => {
		glob(pattern, options || {}, (err, files) => {
			if (err) {
				reject(err);
			} else {
				resolve(files);
			}
		});
	});
}

export function sum(values: number[]) {
	return values.reduce((prev, current) => prev + current, 0);
}

export const getFreePort = (() => {
	let basePort: number = 1234;

	return () => {
		return basePort++;
	};
})();

export const generateRandomString = (() => {
	const CHARS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(
		''
	);
	return (length: number = 25) => {
		return new Array(length)
			.fill('')
			.map(() => {
				return CHARS[Math.floor(Math.random() * CHARS.length)];
			})
			.join('');
	};
})();

export async function generateTempFolder() {
	let folderName: string;
	do {
		folderName = generateRandomString();
	} while (await fs.pathExists(folderName));

	return path.join(TEMP_DIR, folderName);
}

export async function generateTempFileName(
	extension: string,
	prefix: string = ''
) {
	let fileName: string;
	do {
		fileName = `${prefix}${generateRandomString()}.${extension}`;
	} while (await fs.pathExists(fileName));

	await fs.mkdirp(TEMP_DIR);
	return path.join(TEMP_DIR, fileName);
}

export function wait(duration: number) {
	return new Promise<void>((resolve) => {
		setTimeout(resolve, duration);
	});
}

function capitalize(word: string): string {
	return `${word[0].toUpperCase()}${word.slice(1)}`;
}

export function createCamelCaseString(
	parts: string[],
	uppercaseFirst = false
): string {
	return parts
		.map((part, index) => {
			if (index === 0 && !uppercaseFirst) {
				return `${part[0].toLowerCase()}${part.slice(1)}`;
			}
			return capitalize(part);
		})
		.join('');
}

export function findLastIndex<I>(
	arr: I[],
	predicate: (value: I, index: number, obj: I[]) => boolean
): number {
	for (let i = arr.length - 1; i; i--) {
		if (predicate(arr[i], i, arr)) {
			return i;
		}
	}

	return -1;
}

export function findLast<I>(
	arr: I[],
	predicate: (value: I, index: number, obj: I[]) => boolean
): I | undefined {
	const lastIndex = findLastIndex(arr, predicate);
	if (lastIndex === -1) {
		return undefined;
	}
	return arr[lastIndex];
}

export function toCamelCase(str: string, capitalizeFirst: boolean = false) {
	const arr = str.split('-');
	const words = arr.map((item, index) =>
		capitalizeFirst || index > 0
			? capitalize(item.toLowerCase())
			: item.toLowerCase()
	);

	return words.join('');
}
