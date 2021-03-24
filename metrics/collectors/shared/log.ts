import chalk from 'chalk';
import * as path from 'path';
import { BUNDLES, METRICS } from '../../scripts/metrics/metrics';
import { METRICS_DIR, ROOT_DIR } from './constants';

import { DEVELOPMENT } from './settings';

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

export function info(filePath: string, ...data: [any, ...any]) {
	console.log(chalk.blue(`[ ${getTagFromFilePath(filePath)} ] -`), ...data);
}

export function success(filePath: string, ...data: [any, ...any]) {
	console.log(
		chalk.green(chalk.bold(`[ ${getTagFromFilePath(filePath)} ] -`)),
		...data
	);
}

export function warning(filePath: string, ...data: [any, ...any]) {
	console.log(
		chalk.rgb(
			255,
			165,
			0
		)(chalk.bold(`[ ${getTagFromFilePath(filePath)} ] -`)),
		...data
	);
}

export function error(filePath: string, ...data: [any, ...any]) {
	console.log(
		chalk.red(chalk.bold(`[ ${getTagFromFilePath(filePath)} ] -`)),
		...data
	);
}

export function debug(filePath: string, ...data: [any, ...any]) {
	if (!DEVELOPMENT) {
		return;
	}
	console.log(
		chalk.rgb(
			255,
			174,
			0
		)(chalk.bold(`[ ${getTagFromFilePath(filePath)} ] -`)),
		...data
	);
}

export function tempLog(filePath: string, ...data: [any, ...any]) {
	if (!DEVELOPMENT) {
		throw new Error('Temp log still in code');
	}
	console.log(
		chalk.rgb(
			255,
			174,
			0
		)(chalk.bold(`[ ${getTagFromFilePath(filePath)} ] -`)),
		...data
	);
}
