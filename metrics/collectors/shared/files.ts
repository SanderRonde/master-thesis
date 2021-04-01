import * as fs from 'fs-extra';
import * as path from 'path';

export async function writeFile(filePath: string, content: string) {
	await fs.mkdirp(path.dirname(filePath));
	await fs.writeFile(filePath, content, 'utf8');
}

export async function readFile(filePath: string) {
	return await fs.readFile(filePath, 'utf8');
}

export async function transformFile(
	filePath: string,
	transformer: (content: string) => string | Promise<string>
): Promise<{
	oldContent: string;
	newContent: string;
}> {
	const oldContent = await readFile(filePath);
	const newContent = await transformer(oldContent);
	await writeFile(filePath, newContent);

	return {
		oldContent,
		newContent,
	};
}

export async function createCopies(
	paths: {
		[targetPath: string]: string;
	},
	rootPath: string
) {
	for (const target in paths) {
		const targetPath = path.join(rootPath, target);
		if (await fs.pathExists(targetPath)) {
			await fs.unlink(targetPath);
		}
		await fs.copyFile(paths[target], targetPath);
	}
}
