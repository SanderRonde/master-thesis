import { writeFile } from '../files';
import { Dirs, getRenderTimePageDirs } from './generate-render-time-page';
import { notFoundComponentTsTemplate } from './templates/404.component';
import { notFoundComponentHTMLTemplate } from './templates/404.component.html';

async function writeDemoFiles(dirs: Dirs) {
	await writeFile(
		dirs.notFoundComponentHTML,
		notFoundComponentHTMLTemplate()
	);
	await writeFile(dirs.notFoundComponentTs, notFoundComponentTsTemplate());
}

export async function generateDemoPage(baseDir: string, submoduleName: string) {
	const dirs = getRenderTimePageDirs(baseDir, submoduleName);

	await writeDemoFiles(dirs);
}
