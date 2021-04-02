import 'wired-elements';

import { ComponentVisibilitySetterWindow } from '../../../shared/shapes';

declare const window: ComponentVisibilitySetterWindow;

const root = document.getElementById('root')!;
window.availableComponents = ['Button', 'Input', 'Switch'];

window.setVisibleComponent = (componentName, isVisible) => {
	switch (componentName) {
		case 'Button':
			[...document.querySelectorAll('#button')].forEach((b) =>
				b.remove()
			);
			if (isVisible) {
				const btn = document.createElement('wired-button');
				btn.appendChild(document.createTextNode('Button'));
				btn.id = 'button';
				root.appendChild(btn);
			}
			break;
		case 'Input':
			[...document.querySelectorAll('#input')].forEach((b) => b.remove());
			if (isVisible) {
				const input = document.createElement('wired-input');
				input.id = 'input';
				root.appendChild(input);
			}
			break;
		case 'Switch':
			[...document.querySelectorAll('#switch')].forEach((b) =>
				b.remove()
			);
			if (isVisible) {
				const checkbox = document.createElement('wired-checkbox');
				checkbox.id = 'switch';
				root.appendChild(checkbox);
			}
			break;
	}
};
