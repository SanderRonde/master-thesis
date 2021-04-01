import chalk from 'chalk';
import { format } from 'util';
import * as path from 'path';

import { METRICS_DIR } from './constants';
import { DEVELOPMENT } from './settings';
import { BUNDLES, METRICS } from '../../scripts/lib/constants';

const ANSI_REGEX = new RegExp(
	[
		'[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:[a-zA-Z\\d]*(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)',
		'(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-ntqry=><~]))',
	].join('|')
);

function pathSplit(filePath: string) {
	const parts: string[] = [];
	while (true) {
		const { dir, base } = path.parse(filePath);
		filePath = dir;
		parts.push(...base.split('.'));

		if (dir === base) {
			return [
				...parts,
				...(dir !== '' && dir !== '.' ? [dir] : []),
			].reverse();
		}
	}
}

function getTagFromFilePath(filePath: string) {
	if (!filePath.includes('/') && !filePath.includes('\\')) {
		return filePath;
	}

	const splitPath = pathSplit(
		path.relative(path.join(METRICS_DIR, 'collectors'), filePath)
	);
	const bundle =
		splitPath.find((part) => BUNDLES.includes(part as any)) || '?';
	const metric =
		splitPath.find((part) => METRICS.includes(part as any)) || '?';
	return `${bundle}.${metric}`;
}

function getSourceLine() {
	const err = new Error();
	const source = err.stack!.split('\n')[4];

	return path.parse(source.split('at')[1].trim()).base.replace(')', '');
}

function log(rawTag: string, tag: string, ...data: any[]) {
	const formatted = format(
		tag,
		...data.map((d) =>
			typeof d === 'string' ? d.replace(/\t/g, '    ') : d
		)
	);
	const rawFormatted = format(
		rawTag,
		...data.map((d) =>
			typeof d === 'string' ? d.replace(/\t/g, '    ') : d
		)
	);
	const sourceLine = getSourceLine();
	if (!process.stdout.columns) {
		process.stdout.write(`${formatted}\n`);
		return;
	}
	const padding = new Array(
		process.stdout.columns -
			((rawFormatted.replace(ANSI_REGEX, '').length + sourceLine.length) %
				process.stdout.columns)
	)
		.fill(' ')
		.join('');
	process.stdout.write(`${formatted}${padding}${sourceLine}\n`);
}

export function info(filePath: string, ...data: [any, ...any]) {
	const raw = `[ ${getTagFromFilePath(filePath)} ] -`;
	log(raw, chalk.blue(raw), ...data);
}

export function success(filePath: string, ...data: [any, ...any]) {
	const raw = `[ ${getTagFromFilePath(filePath)} ] -`;
	log(raw, chalk.green(chalk.bold(raw)), ...data);
}

export function warning(filePath: string, ...data: [any, ...any]) {
	const raw = `[ ${getTagFromFilePath(filePath)} ] -`;
	log(raw, chalk.rgb(255, 165, 0)(chalk.bold(raw)), ...data);
}

export function error(filePath: string, ...data: [any, ...any]) {
	const raw = `[ ${getTagFromFilePath(filePath)} ] -`;
	log(raw, chalk.red(chalk.bold(raw)), ...data);
}

export function debug(filePath: string, ...data: [any, ...any]) {
	if (!DEVELOPMENT && !process.argv.includes('--log-debug')) {
		return;
	}
	const raw = `[ ${getTagFromFilePath(filePath)} ] -`;
	log(
		raw,

		chalk.rgb(255, 174, 0)(chalk.bold(raw)),
		...data
	);
}

export function tempLog(filePath: string, ...data: [any, ...any]) {
	if (!DEVELOPMENT) {
		throw new Error('Temp log still in code');
	}
	const raw = `[ ${getTagFromFilePath(filePath)} ] -`;
	log(raw, chalk.rgb(255, 174, 0)(chalk.bold(raw)), ...data);
}
