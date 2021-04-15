import React from 'react';
import ReactDOM from 'react-dom';

import { Button, TextField, Switch } from '@material-ui/core';

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
				numberOfComponents.map(() => <TextField />)}
			{visibleComponent === 'Switch' &&
				numberOfComponents.map(() => <Switch />)}
		</>
	);
};

ReactDOM.render(<App />, document.getElementById('root'));
