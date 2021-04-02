import React from 'react';
import ReactDOM from 'react-dom';

import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Checkbox } from 'primereact/checkbox';

import {
	ComponentVisibilitySetterWindow,
	BaseComponent,
} from '../../../shared/shapes';

declare const window: ComponentVisibilitySetterWindow;

window.availableComponents = ['Button', 'Input', 'Switch'];

const App = () => {
	const [
		visibleComponent,
		setVisibleComponent,
	] = React.useState<BaseComponent | null>(null);

	window.setVisibleComponent = (componentName, isVisible) => {
		if (!isVisible) {
			setVisibleComponent(null);
		} else {
			setVisibleComponent(componentName);
		}
	};

	return (
		<>
			{visibleComponent === 'Button' && <Button>Content</Button>}
			{visibleComponent === 'Input' && <InputText />}
			{visibleComponent === 'Switch' && <Checkbox />}
		</>
	);
};

ReactDOM.render(<App />, document.getElementById('root'));
