import '@cds/core/button/register';
import '@cds/core/toggle/register';
import '@cds/core/input/register';

import { ComponentVisibilitySetterWindow } from '../../../shared/shapes';

declare const window: ComponentVisibilitySetterWindow;

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
					const btn = document.createElement('cds-button');
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
					const input = document.createElement('cds-input');
					input.id = 'input';
					input.appendChild(document.createElement('label'));
					input.appendChild(document.createElement('input'));
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
					const checkbox = document.createElement('cds-toggle');
					checkbox.id = 'switch';
					checkbox.appendChild(document.createElement('label'));
					const input = document.createElement('input');
					input.type = 'checkbox';
					checkbox.appendChild(input);
					root.appendChild(checkbox);
				}
			}
			break;
	}
};
