import chalk from 'chalk';
import { format } from 'util';
import * as path from 'path';

import { DEVELOPMENT } from './settings';

const ANSI_REGEX = new RegExp(
	[
		'[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:[a-zA-Z\\d]*(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)',
		'(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-ntqry=><~]))',
	].join('|')
);

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

export function info(tagName: string, ...data: [any, ...any]) {
	const raw = `[ ${tagName} ] -`;
	log(raw, chalk.blue(raw), ...data);
}

export function success(tagName: string, ...data: [any, ...any]) {
	const raw = `[ ${tagName} ] -`;
	log(raw, chalk.green(chalk.bold(raw)), ...data);
}

export function warning(tagName: string, ...data: [any, ...any]) {
	const raw = `[ ${tagName} ] -`;
	log(raw, chalk.rgb(255, 165, 0)(chalk.bold(raw)), ...data);
}

export function error(tagName: string, ...data: [any, ...any]) {
	const raw = `[ ${tagName} ] -`;
	log(raw, chalk.red(chalk.bold(raw)), ...data);
}

export function debug(tagName: string, ...data: [any, ...any]) {
	if (!DEVELOPMENT && !process.env.LOG_DEBUG) {
		return;
	}
	const raw = `[ ${tagName} ] -`;
	log(
		raw,

		chalk.rgb(255, 174, 0)(chalk.bold(raw)),
		...data
	);
}

export function tempLog(tagName: string, ...data: [any, ...any]) {
	if (!DEVELOPMENT) {
		throw new Error('Temp log still in code');
	}
	const raw = `[ ${tagName} ] -`;
	log(raw, chalk.rgb(255, 174, 0)(chalk.bold(raw)), ...data);
}
