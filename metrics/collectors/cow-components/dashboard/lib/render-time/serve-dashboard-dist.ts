import express from 'express';
import { AddressInfo } from 'node:net';
import * as path from 'path';
import serveStatic from 'serve-static';

import { runFunctionIfCalledFromScript } from '../../../../shared/helpers';
import { success } from '../../../../shared/log';
import { DASHBOARD_DIST_DIR } from '../constants';

export function doWithServer<R>(
	port: number,
	root: string,
	callback?: (port: number) => Promise<R>
) {
	return new Promise<R>((resolve) => {
		const app = express();
		app.use(serveStatic(root));
		app.all('*', (_, res) => {
			res.sendFile(path.join(root, 'index.html'));
		});
		const server = app.listen(port, async () => {
			port = port === 0 ? (server.address() as AddressInfo).port : port;
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
	await doWithServer(
		process.argv[3] ? parseInt(process.argv[3], 10) : 1234,
		process.argv[2] || DASHBOARD_DIST_DIR
	);
}, __filename);
