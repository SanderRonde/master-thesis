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
	const [numberOfComponents, setNumberOfComponents] = React.useState<
		unknown[]
	>([]);

	window.setVisibleComponent = (
		componentName,
		numberOfComponents,
		isVisible
	) => {
		if (!isVisible) {
			setVisibleComponent(null);
		} else {
			setVisibleComponent(componentName);
		}
		setNumberOfComponents(new Array(numberOfComponents).fill(''));
	};

	return (
		<>
			{visibleComponent === 'Button' &&
				numberOfComponents.map(() => <Button>Content</Button>)}
			{visibleComponent === 'Input' &&
				numberOfComponents.map(() => <InputText />)}
			{visibleComponent === 'Switch' &&
				numberOfComponents.map(() => <Checkbox />)}
		</>
	);
};

ReactDOM.render(<App />, document.getElementById('root'));
