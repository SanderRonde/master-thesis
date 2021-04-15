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