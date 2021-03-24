import cpx from 'cpx';
import rimraf from 'rimraf';

export const TS_NODE_COMMAND =
	'node --no-deprecation --enable-source-maps --trace-warnings -r ts-node/register/transpile-only';

export function cpxAsync(
	source: string,
	dest: string,
	options: cpx.AsyncOptions = {}
) {
	return new Promise<void>((resolve, reject) => {
		cpx.copy(source, dest, options, (err) => {
			if (err) {
				reject(err);
			} else {
				resolve();
			}
		});
	});
}

export function rimrafAsync(path: string, options?: rimraf.Options) {
	return new Promise<void>((resolve, reject) => {
		rimraf(path, options || {}, (err) => {
			if (err) {
				reject(err);
			} else {
				resolve();
			}
		});
	});
}
