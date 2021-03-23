import express from 'express';
import * as path from 'path';
import serveStatic from 'serve-static';

import {
	getFreePort,
	runFunctionIfCalledFromScript,
} from '../../../shared/helpers';
import { DASHBOARD_DIST_DIR } from '../constants';

export function doWithServer(
	port: number,
	callback?: (port: number) => Promise<void>
) {
	return new Promise<void>((resolve) => {
		const app = express();
		app.use(serveStatic(DASHBOARD_DIST_DIR));
		app.all('*', (_, res) => {
			res.sendFile(path.join(DASHBOARD_DIST_DIR, 'index.html'));
		});
		const server = app.listen(port, async () => {
			console.log(`Listening on port ${port}`);
			if (callback) {
				await callback(port);
				server.close();
				resolve();
			}
		});
	});
}

runFunctionIfCalledFromScript(async () => {
	await doWithServer(getFreePort());
}, __filename);
