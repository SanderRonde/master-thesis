import { Worker } from 'worker_threads';
import * as path from 'path';
import pngJs from 'pngjs';
import textEncoding from 'text-encoding';

import { NUM_WORKERS } from '../../../../shared/settings';

export class ImageCompareWorkersClass {
	private _workers: Worker[];
	private _index: number = 0;

	constructor() {
		this._workers = new Array(NUM_WORKERS)
			.fill('')
			.map(
				() =>
					new Worker(
						path.join(__dirname, '../image-compare-worker.js')
					)
			);
	}

	async init(targetImage: pngJs.PNG) {
		const targetBuffer = pngJs.PNG.sync.write(targetImage);
		const sharedTargetBuffer = new Uint8Array(
			new SharedArrayBuffer(targetBuffer.length)
		);
		sharedTargetBuffer.set(targetBuffer);

		await Promise.all(
			this._workers.map((worker) => {
				return new Promise<void>((resolve) => {
					worker.postMessage({
						type: 'target',
						target: sharedTargetBuffer,
					});
					worker.once('message', (message) => {
						if (message.type === 'targetReceived') {
							resolve();
						}
					});
				});
			})
		);

		return this;
	}

	onResult() {
		return new Promise<number>(async (resolve) => {
			let lowestNumber: number = Infinity;
			await Promise.all(
				this._workers.map((worker) => {
					return new Promise<void>((resolve) => {
						worker.on('message', (message) => {
							if (message.type === 'finished') {
								resolve();
							} else if (message.type === 'found') {
								lowestNumber = Math.min(
									lowestNumber,
									message.time
								);
							}
						});
					});
				})
			);
			resolve(lowestNumber);
		});
	}

	onStopInput() {
		return new Promise<void>(async (resolve) => {
			this._workers.forEach((worker) => {
				worker.on('message', (message) => {
					if (message.type === 'found') {
						resolve();
					}
				});
			});
		});
	}

	pushToQueue(componentName: string, data: string, time: number) {
		this._index = ++this._index % NUM_WORKERS;
		const worker = this._workers[this._index];
		const dataBuffer = new textEncoding.TextEncoder().encode(data);
		worker.postMessage({
			type: 'compare',
			data: {
				time,
				buffer: dataBuffer,
				componentName
			},
		});
	}

	async stop() {
		await Promise.all(this._workers.map((worker) => worker.terminate()));
	}
}
