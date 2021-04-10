import { ifTrue } from '../../../../scripts/lib/helpers';
import { getComponentName } from '../../../../submodules/30mhz-dashboard-basic/src/lib/design-library-wrappers/react/scripts/template/declaration';
import { defaultValuesTemplate } from '../../../../submodules/30mhz-dashboard-basic/src/lib/storybook/scripts/lib/templates/default-values-template';
import { getJoinedComponentDefs } from '../../dashboard/lib/render-time/generate-render-time-page';
import { getSanitizedComponentName } from '../../dashboard/lib/render-time/lib/generate-render-time-html';
import { JoinedDefinition } from '../../dashboard/lib/render-time/lib/get-component-tag';
import { FRAMEWORK_NAME } from '../lib/constants';

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
)} } from '../../packages/${FRAMEWORK_NAME}';
`;

const componentTemplate = (component: JoinedDefinition) => `
	{visibleComponent === '${component.component.name}' && <${getComponentName(
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
)} }
`;

const componentsTemplate = (components: JoinedDefinition[]) => `
${components.map((c) => componentTemplate(c)).join('\n')}`;

const appTemplate = (components: JoinedDefinition[]) => `
const App: React.FC<{}> = () => {
	const [ visibleComponent, setVisibleComponent ] = React.useState<string|null>(null);

	window.setVisibleComponent = (name: string|null) => {
		setVisibleComponent(name);
	}
	
	return (
		<div>
			${componentsTemplate(components)}
		</div>
	)
};

ReactDOM.render(<App />, document.getElementById('root'));`;

export async function getRenderTimeJsTemplate() {
	const components = await getJoinedComponentDefs();
	return `${importTemplate(components)}
	${defsTemplate(components)}
	${appTemplate(components)}
	\n\n
	`;
}
