import chalk from 'chalk';
import { format } from 'util';

import { DEVELOPMENT } from './settings';

function log(tag: string, ...data: any[]) {
	const formatted = format(
		tag,
		...data.map((d) =>
			typeof d === 'string' ? d.replace(/\t/g, '    ') : d
		)
	);
	if (!process.stdout.columns) {
		process.stdout.write(`${formatted}\n`);
		return;
	}
	console.log(tag, ...data);
}

export function info(tagName: string, ...data: [any, ...any]) {
	const raw = `[ ${tagName} ] -`;
	log(chalk.blue(raw), ...data);
}

export function success(tagName: string, ...data: [any, ...any]) {
	const raw = `[ ${tagName} ] -`;
	log(chalk.green(chalk.bold(raw)), ...data);
}

export function warning(tagName: string, ...data: [any, ...any]) {
	const raw = `[ ${tagName} ] -`;
	log(chalk.rgb(255, 165, 0)(chalk.bold(raw)), ...data);
}

export function error(tagName: string, ...data: [any, ...any]) {
	const raw = `[ ${tagName} ] -`;
	log(chalk.red(chalk.bold(raw)), ...data);
}

export function debug(tagName: string, ...data: [any, ...any]) {
	if (!DEVELOPMENT && !process.env.LOG_DEBUG) {
		return;
	}
	const raw = `[ ${tagName} ] -`;
	log(chalk.rgb(255, 174, 0)(chalk.bold(raw)), ...data);
}

export function tempLog(tagName: string, ...data: [any, ...any]) {
	if (!DEVELOPMENT) {
		throw new Error('Temp log still in code');
	}
	const raw = `[ ${tagName} ] -`;
	log(chalk.rgb(255, 174, 0)(chalk.bold(raw)), ...data);
}
