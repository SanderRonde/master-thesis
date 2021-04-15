import express from 'express';
import { AddressInfo } from 'node:net';
import * as path from 'path';
import serveStatic from 'serve-static';
import { runFunctionIfCalledFromScript } from '../helpers';
import { success } from '../log';
import { Server } from 'http';

export function doWithServer<R>(
	port: number,
	root: string,
	callback?: (port: number) => Promise<R>
) {
	return new Promise<R>(async (resolve) => {
		const { stop, port: newPort } = await startServer(port, root);
		const returnValue = callback ? await callback(newPort) : undefined;
		stop();
		resolve(returnValue as R);
	});
}

export async function startServer(port: number, root: string) {
	const app = express();
	app.use(serveStatic(root));
	app.all('*', (_, res) => {
		res.sendFile(path.join(root, 'index.html'));
	});

	const server = await new Promise<Server>((resolve) => {
		const server = app.listen(port, () => {
			port = port === 0 ? (server.address() as AddressInfo).port : port;
			success('server', `Listening on port ${port}`);
			resolve(server);
		});
	});
	return {
		stop() {
			server.close();
		},
		port,
	};
}

runFunctionIfCalledFromScript(async () => {
	if (!process.argv[2]) {
		throw new Error('No to-serve path passed');
	}
	await doWithServer(
		process.argv[3] ? parseInt(process.argv[3], 10) : 1234,
		process.argv[2]
	);
}, __filename);
