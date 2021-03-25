import { parentPort } from 'worker_threads';
import pngJs from 'pngjs';
import pixelmatch from 'pixelmatch';
import textEncoding from 'text-encoding';
import * as fs from 'fs-extra';

import {
	asyncCreatePNG,
	generateTempFileName,
	resizeImage,
} from '../../../shared/helpers';
import {
	RENDER_TIME_HEIGHT,
	RENDER_TIME_CROP,
	RENDER_TIME_WIDTH,
	GOLDEN_FRAME_MAX_DIFF_PIXELS,
	OUTPUT_IMAGES,
} from '../../../shared/settings';

let targetImage: pngJs.PNG | null = null;

async function isScreencastGoldenImage(
	data: Uint8Array,
	targetFrame: pngJs.PNG,
	componentName: string,
	time: number
): Promise<boolean> {
	const image = resizeImage(
		await asyncCreatePNG(
			Buffer.from(new textEncoding.TextDecoder().decode(data), 'base64')
		),
		{
			height: RENDER_TIME_HEIGHT - RENDER_TIME_CROP,
			width: RENDER_TIME_WIDTH,
			startY: RENDER_TIME_CROP,
		}
	);

	// Compare dimensions
	if (
		image.width !== targetFrame.width ||
		image.height !== targetFrame.height
	) {
		throw new Error('Heights of frame and target frame do not match up');
	}

	const diff = OUTPUT_IMAGES
		? new pngJs.PNG({
				width: image.width,
				height: image.height,
		  })
		: null;

	const pixelsDiff = pixelmatch(
		image.data,
		targetFrame.data,
		diff?.data || null,
		targetFrame.width,
		targetFrame.height
	);
	if (OUTPUT_IMAGES) {
		await fs.writeFile(
			await generateTempFileName(
				'png',
				`render-time-diff-${componentName}-${time}`
			),
			pngJs.PNG.sync.write(diff!)
		);
	}

	return pixelsDiff <= GOLDEN_FRAME_MAX_DIFF_PIXELS;
}

const queue: {
	buffer: Uint8Array;
	time: number;
	componentName: string;
}[] = [];
let working: boolean = false;
let done: boolean = false;

async function addToQueue(data: {
	buffer: Uint8Array;
	time: number;
	componentName: string;
}) {
	queue.push(data);
	if (working) {
		// Already working, don't start another instance
		return;
	}

	working = true;
	while (queue.length) {
		const { buffer, time, componentName } = queue.shift()!;
		if (
			await isScreencastGoldenImage(
				buffer,
				targetImage!,
				componentName,
				time
			)
		) {
			done = true;

			// Let the parent know
			parentPort!.postMessage({
				type: 'found',
				time,
			});
		}
	}
	if (done) {
		parentPort?.postMessage({
			type: 'finished',
		});
	}
	working = false;
}

parentPort!.on('message', async (message) => {
	switch (message.type) {
		case 'target':
			targetImage = await asyncCreatePNG(message.target);
			parentPort!.postMessage({
				type: 'targetReceived',
			});
			break;
		case 'compare':
			if (done) return;
			if (!targetImage) {
				throw new Error('Target image not set');
			}
			addToQueue(message.data);
			break;
		case 'stop':
			done = true;
			break;
	}
});
