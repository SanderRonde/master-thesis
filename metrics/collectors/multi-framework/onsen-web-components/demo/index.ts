import ons from 'onsenui';

import { ComponentVisibilitySetterWindow } from '../../../shared/shapes';

declare const window: ComponentVisibilitySetterWindow;

ons.platform.select('chrome');

const root = document.getElementById('root')!;
window.availableComponents = ['Button', 'Input', 'Switch'];

window.setVisibleComponent = (componentName, numberOfComponents, isVisible) => {
	switch (componentName) {
		case 'Button':
			[...document.querySelectorAll('#button')].forEach((b) =>
				b.remove()
			);
			if (isVisible) {
				for (let i = 0; i < numberOfComponents; i++) {
					const btn = document.createElement('ons-button');
					btn.appendChild(document.createTextNode('Button'));
					btn.id = 'button';
					root.appendChild(btn);
				}
			}
			break;
		case 'Input':
			[...document.querySelectorAll('#input')].forEach((b) => b.remove());
			if (isVisible) {
				for (let i = 0; i < numberOfComponents; i++) {
					const input = document.createElement(
						'ons-input'
					) as HTMLInputElement;
					input.setAttribute('float', '');
					input.setAttribute('modifier', 'underbar');
					input.value = 'input';
					input.id = 'input';
					root.appendChild(input);
				}
			}
			break;
		case 'Switch':
			[...document.querySelectorAll('#switch')].forEach((b) =>
				b.remove()
			);
			if (isVisible) {
				for (let i = 0; i < numberOfComponents; i++) {
					const checkbox = document.createElement('ons-checkbox');
					checkbox.id = 'switch';
					root.appendChild(checkbox);
				}
			}
			break;
	}
};
