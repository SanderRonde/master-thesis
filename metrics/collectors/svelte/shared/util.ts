import {
	ComponentFiles,
	TextOnlyComponentFile,
} from '../../dashboard/lib/get-components';

const SCRIPT_REGEX = /<script>((.|\s)*?)<\/script>/g;

export function splitSvelteIntoParts(
	svelteCode: string
): {
	html: string;
	js: string;
} {
	const scripts: string[] = [];

	for (
		let match = SCRIPT_REGEX.exec(svelteCode);
		match;
		match = SCRIPT_REGEX.exec(svelteCode)
	) {
		svelteCode =
			svelteCode.slice(0, match.index) +
			svelteCode.slice(match.index + match[0].length);

		scripts.push(match[1]);
	}

	return {
		html: svelteCode,
		js: scripts.join('\n'),
	};
}

export function createComponentFileFromSvelte(
	svelteCode: string,
	componentName: string
): ComponentFiles {
	const { html, js } = splitSvelteIntoParts(svelteCode);

	return {
		html: new TextOnlyComponentFile(componentName, html),
		js: new TextOnlyComponentFile(componentName, js),
	};
}