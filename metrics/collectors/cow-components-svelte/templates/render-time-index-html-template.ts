export async function getRenderTimeIndexHTMLTemplate() {
	return `<html><head><link rel="stylesheet" href="./index.css" /></head><body style="margin: 50px;"><div style="margin-top: 300px;" id="root"></div><script src="index.bundle.js"></script></body></html>`;
}
