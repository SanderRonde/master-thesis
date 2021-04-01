import * as path from 'path';

import { ComponentFiles } from '../cow-components/dashboard/lib/get-components';
import { METRICS_DIR, SUBMODULES_DIR } from './constants';

export type MaybeThennable<T> = T | Promise<T>;

export type Templates = {
	[fileName: string]: string;
};

export abstract class UILibraryClass {
	private static _libraryName: string | null = null;
	static get libraryName(): string {
		if (!this._libraryName) {
			throw new Error('Not implemented');
		}
		return this._libraryName;
	}
	static set libraryName(libName: string) {
		this._libraryName = libName;
	}

	private static _frameworkName: string | null = null;
	static get frameworkName(): string {
		if (!this._frameworkName) {
			throw new Error('Not implemented');
		}
		return this._frameworkName;
	}
	static set frameworkName(frameworkName: string) {
		this._frameworkName = frameworkName;
	}

	static get submodulePath() {
		return path.join(SUBMODULES_DIR, this.libraryName);
	}

	static get demoPath() {
		return path.join(
			METRICS_DIR,
			'collectors',
			this.frameworkName,
			this.libraryName,
			'demo'
		);
	}

	static getTemplates(): MaybeThennable<Templates> {
		throw new Error('Not implemented');
	}

	static getComponents(): MaybeThennable<ComponentFiles[]> {
		throw new Error('Not implemented');
	}
}

type BaseComponent = 'Button' | 'Switch' | 'Input' | 'DatePicker';

export interface ComponentVisibilitySetterWindow extends Window {
	setVisibleComponent(componentName: BaseComponent, visible: boolean): void;
	avilableComponents: BaseComponent[];
}
