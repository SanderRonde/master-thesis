import cpx from 'cpx';
import { setEnvVar } from 'makfy';
import { ExecFunction } from 'makfy/dist/lib/schema/runtime';
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

export function ifTrue(str: string, condition: boolean): string {
	if (condition) {
		return str;
	}
	return '';
}

export function omitArr<V>(arr: V[], ...toOmit: V[]): V[] {
	return arr.filter((entry) => !toOmit.includes(entry));
}

export async function setContexts(
	exec: ExecFunction,
	args: { prod: boolean; 'log-debug': boolean }
): Promise<ExecFunction> {
	if (args.prod) {
		exec = (await exec(setEnvVar('ENV', 'production'))).keepContext;
	}
	if (args['log-debug']) {
		exec = (await exec(setEnvVar('LOG_DEBUG', 'true'))).keepContext;
	}
	return exec;
}
