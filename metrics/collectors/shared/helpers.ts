import * as path from 'path';
import glob from 'glob';
import { IOptions } from 'glob';

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
			console.log(`Script "${scriptFilePath}" failed`);
			console.log(e);

			// The version of node we use does not yet exit
			// on rejected promises. As such throwing an error
			// here won't do much. Instead, we need to exit
			// manually.
			// eslint-disable-next-line no-process-exit
			process.exit(1);
		}
	}
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
	return values.reduce((prev, current) => prev + current, 0)
}