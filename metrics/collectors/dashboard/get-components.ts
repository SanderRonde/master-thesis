import {
	getCowComponents,
	getMatchingComponent,
} from '../../../30mhz-dashboard/src/lib/web-components/scripts/lib/get-cow-components';

export interface ReadFile {
	filePath: string;
	content: string;
}

export interface CowComponentImport extends ReadFile {
	componentName: string;
}

export interface ComponentFiles {
	js: CowComponentImport;
	html: CowComponentImport | null;
}

export async function getComponents(): Promise<ComponentFiles[]> {
	const componentFiles = await getCowComponents('src');

	const templateFiles = await getCowComponents('src', 'html');

	return componentFiles.map((componentFile) => {
		return {
			js: componentFile,
			html: getMatchingComponent(componentFile, templateFiles),
		};
	});
}
