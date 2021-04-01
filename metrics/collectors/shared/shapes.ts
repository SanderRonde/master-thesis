import { ComponentFiles } from '../cow-components/dashboard/lib/get-components';

export type MaybeThennable<T> = T | Promise<T>;

export type Templates = {
	[fileName: string]: string;
};

type BaseComponent = 'Button' | 'Switch' | 'Input' | 'DatePicker';

export interface ComponentVisibilitySetterWindow extends Window {
	setVisibleComponent(componentName: BaseComponent, visible: boolean): void;
	availableComponents: BaseComponent[];
}

export type GetComponentFunction = (
	submodulePath: string
) => Promise<ComponentFiles[]>;

export type GetComponentModule = {
	getComponents: GetComponentFunction;
};
