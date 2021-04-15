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
			<Form>
				{visibleComponent === 'Input' &&
					numberOfComponents.map(() => <Form.Control type="text" />)}
				{visibleComponent === 'Switch' &&
					numberOfComponents.map(() => (
						<Form.Check type="checkbox" />
					))}
			</Form>
		</>
	);
};

ReactDOM.render(<App />, document.getElementById('root'));
