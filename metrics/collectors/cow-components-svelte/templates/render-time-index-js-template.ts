import { ifTrue } from '../../../scripts/lib/helpers';
import { defaultValuesTemplate } from '../../../submodules/30mhz-dashboard/src/lib/storybook/scripts/lib/templates/default-values-template';
import { getJoinedComponentDefs } from '../../dashboard/lib/render-time/generate-render-time-page';
import { getSanitizedComponentName } from '../../dashboard/lib/render-time/lib/generate-render-time-html';
import { JoinedDefinition } from '../../dashboard/lib/render-time/lib/get-component-tag';

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

const componentCaseTemplate = (component: JoinedDefinition) => `
case '${component.component.name}':
	if (!visible) {
		[...document.querySelectorAll('${
			component.tagName
		}')].forEach(el => el.remove());
	} else {
		const element = document.createElement('${component.tagName}');
		${component.props
			.filter((prop) => !prop.isEventListener && prop.demoDefaultValue)
			.map((prop) => {
				return `element['${prop.name}'] = ${getSanitizedComponentName(
					component
				)}Defaults.ReferencedTypes['${prop.name}DemoDefaultValue'];`;
			})
			.join('\n')}
		${ifTrue(
			`element.appendChild(document.createTextNode('Content'))`,
			component.hasChildren
		)}
	}
	break;`;

const appTemplate = (components: JoinedDefinition[]) => `
window.setVisibleComponent = (name: string, visible: boolean) => {
	switch (name) {
		${components.map((component) => componentCaseTemplate(component)).join('\n')}
	}
}
`;

export async function getRenderTimeJsTemplate() {
	const components = await getJoinedComponentDefs();
	return `${defsTemplate(components)}
	${appTemplate(components)}
	\n\n
	`;
}

export async function getRenderTimeIndexJsTemplate() {
	return `import App from './App.svelte';

	const app = new App({
		target: document.getElementById('root'),
	});
	
	export default app;
	`;
}
