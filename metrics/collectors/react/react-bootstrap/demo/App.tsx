import React from 'react';
import ReactDOM from 'react-dom';

import { Button, Form } from 'react-bootstrap';

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
			<Form>
				{visibleComponent === 'Input' && <Form.Control type="text" />}
				{visibleComponent === 'Switch' && (
					<Form.Check type="checkbox" />
				)}
			</Form>
		</>
	);
};

ReactDOM.render(<App />, document.getElementById('root'));
