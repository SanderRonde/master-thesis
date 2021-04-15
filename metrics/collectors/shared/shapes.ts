import { ComponentFiles } from '../metric-definitions/types';

/**
 * Available components
 */
export enum BASE_COMPONENT {
	BUTTON = 'Button',
	SWITCH = 'Switch',
	INPUT = 'Input',
}
export type BaseComponent = 'Button' | 'Switch' | 'Input';

export interface ComponentVisibilitySetterWindow extends Window {
	setVisibleComponent(
		componentName: BaseComponent,
		numberOfComponents: number,
		visible: boolean
	): void;
	availableComponents: BaseComponent[];
}

/**
 * Get components function
 */
export type GetComponentFunction = (
	submodulePath: string
) => Promise<
	| ComponentFiles[]
	| {
			extraLevels: number;
			components: ComponentFiles[];
	  }
>;

export type GetComponentModule = {
	getComponents: GetComponentFunction;
};
