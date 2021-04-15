import { getSanitizedComponentName } from '../../../../../collectors/shared/dashboard/generate-render-time-html';
import { getJoinedComponentDefs } from '../../../../../collectors/shared/dashboard/generate-render-time-page';
import { JoinedDefinition } from '../../../../../collectors/shared/dashboard/get-component-tag';
import { defaultValuesTemplate } from '../../../../../submodules/30mhz-dashboard/src/lib/storybook/scripts/lib/templates/default-values-template';
import { ifTrue } from '../../../helpers';

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
		for (let i = 0; i < numberOfComponents; i++) {
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
			)};
			document.getElementById('root').appendChild(element);
		}
	}
	break;`;

const appTemplate = (components: JoinedDefinition[]) => `
window.availableComponents = [${components
	.map((component) => `'${component.component.name}'`)
	.join(', ')}]

window.setVisibleComponent = (name: string, numberOfComponents: number, visible: boolean) => {
	switch (name) {
		${components.map((component) => componentCaseTemplate(component)).join('\n')}
	}
}
`;

export async function getRenderTimeJsTemplate(submoduleName: string) {
	const components = await getJoinedComponentDefs(submoduleName);
	return `
	import '../../packages/native';
	
	${defsTemplate(components)}
	${appTemplate(components)}
	\n\n
	`;
}
