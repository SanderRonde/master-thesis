export interface ReadFile {
	filePath: string;
	content: string;
}

interface CowComponentImport extends ReadFile {
	componentName: string;
}

export interface ComponentFiles {
	js: CowComponentImport;
	html: CowComponentImport | null;
}