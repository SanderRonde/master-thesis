declare module 'puppeteer-mass-screenshots' {
	class MassScreenshots {
		init(
			page: import('puppeteer').Page,
			screenshotsPath: string
		): Promise<void>;

		start(): Promise<void>
		stop(): Promise<void>
	}

	export = MassScreenshots;
}
