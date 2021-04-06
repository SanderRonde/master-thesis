import { ComponentFiles } from '../cow-components/dashboard/lib/get-components';

/**
 * Available components
 */
export enum BASE_COMPONENT {
	BUTTON = 'Button',
	SWITCH = 'Switch',
	INPUT = 'Input',
	DATE_PICKER = 'DatePicker'
}
export type BaseComponent = 'Button' | 'Switch' | 'Input' | 'DatePicker';

export interface ComponentVisibilitySetterWindow extends Window {
	setVisibleComponent(componentName: BaseComponent, visible: boolean): void;
	availableComponents: BaseComponent[];
}

/**
 * Get components function
 */
export type GetComponentFunction = (
	submodulePath: string
) => Promise<ComponentFiles[]>;

export type GetComponentModule = {
	getComponents: GetComponentFunction;
};
