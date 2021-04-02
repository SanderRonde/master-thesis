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
			{visibleComponent === 'Input' && <TextField />}
			{visibleComponent === 'Switch' && <Switch />}
		</>
	);
};

ReactDOM.render(<App />, document.getElementById('root'));
