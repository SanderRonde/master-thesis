import express from 'express';
import * as path from 'path';
import serveStatic from 'serve-static';

import {
	getFreePort,
	runFunctionIfCalledFromScript,
} from '../../../shared/helpers';
import { success } from '../../../shared/log';
import { DASHBOARD_DIST_DIR } from '../constants';

export function doWithServer<R>(
	port: number,
	callback?: (port: number) => Promise<R>
) {
	return new Promise<R>((resolve) => {
		const app = express();
		app.use(serveStatic(DASHBOARD_DIST_DIR));
		app.all('*', (_, res) => {
			res.sendFile(path.join(DASHBOARD_DIST_DIR, 'index.html'));
		});
		const server = app.listen(port, async () => {
			success('server', `Listening on port ${port}`);
			if (callback) {
				const callbackReturnValue = await callback(port);
				server.close();
				resolve(callbackReturnValue);
			}
		});
	});
}

runFunctionIfCalledFromScript(async () => {
	await doWithServer(getFreePort());
}, __filename);
