import { ifTrue } from '../../../helpers';
import { getComponentName } from '../../../../../submodules/30mhz-dashboard/src/lib/design-library-wrappers/react/scripts/template/declaration';
import { defaultValuesTemplate } from '../../../../../submodules/30mhz-dashboard/src/lib/storybook/scripts/lib/templates/default-values-template';
import { getSanitizedComponentName } from '../../../../../collectors/shared/dashboard/generate-render-time-html';
import { JoinedDefinition } from '../../../../../collectors/shared/dashboard/get-component-tag';
import { getJoinedComponentDefs } from '../../../../../collectors/shared/dashboard/generate-render-time-page';

const defsTemplate = (components: JoinedDefinition[]) => `
${components
	.map(
		(component) => `namespace ${getSanitizedComponentName(
			component
		)}Defaults {
	export ${defaultValuesTemplate(component)}
}\n`
	)
	.join('\n')}`;

const importTemplate = (
	components: JoinedDefinition[]
) => `import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { ${components.map((component) =>
	getComponentName(component)
)} } from '../../packages/react';
`;

const componentTemplate = (component: JoinedDefinition) => `
	{visibleComponent === '${
		component.component.name
	}' && componentArr.map(() => <${getComponentName(
	component
)} ${component.props
	.filter((prop) => !prop.isEventListener && prop.demoDefaultValue)
	.map((prop) => {
		return `${prop.name}={${getSanitizedComponentName(
			component
		)}Defaults.ReferencedTypes['${prop.name}DemoDefaultValue']}`;
	})
	.join(' ')} ${ifTrue('/', !component.hasChildren)}>${ifTrue(
	`Content </${getComponentName(component)}>`,
	component.hasChildren
)} )}
`;

const componentsTemplate = (components: JoinedDefinition[]) => `
${components.map((c) => componentTemplate(c)).join('\n')}`;

const appTemplate = (components: JoinedDefinition[]) => `
const App: React.FC<{}> = () => {
	const [ visibleComponent, setVisibleComponent ] = React.useState<string|null>(null);
	const [ componentArr, setComponentArr ] = React.useState<unknown[]>([]);

	window.setVisibleComponent = (name: string|null, numberOfComponents: number) => {
		setVisibleComponent(name);
		setComponentArr(new Array(numberOfComponents).fill(''));
	}

	window.availableComponents = [${components
		.map((component) => `'${component.component.name}'`)
		.join(', ')}]
	
	return (
		<div>
			${componentsTemplate(components)}
		</div>
	)
};

ReactDOM.render(<App />, document.getElementById('root'));`;

export async function getRenderTimeJsTemplate(submoduleName: string) {
	const components = await getJoinedComponentDefs(submoduleName);
	return `${importTemplate(components)}
	${defsTemplate(components)}
	${appTemplate(components)}
	\n\n
	`;
}
