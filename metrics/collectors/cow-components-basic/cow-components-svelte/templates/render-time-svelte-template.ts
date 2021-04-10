import { ifTrue } from '../../../../scripts/lib/helpers';
import { ReactProperty } from '../../../../submodules/30mhz-dashboard-basic/src/lib/design-library-wrappers/react/scripts/lib/create-react-component';
import { getComponentName } from '../../../../submodules/30mhz-dashboard-basic/src/lib/design-library-wrappers/react/scripts/template/declaration';
import { defaultValuesTemplate } from '../../../../submodules/30mhz-dashboard-basic/src/lib/storybook/scripts/lib/templates/default-values-template';
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

const getPropDefaultValueName = (
	prop: ReactProperty,
	component: JoinedDefinition
) => {
	return `${getSanitizedComponentName(component)}Default${prop.name.replace(
		/[^a-zA-Z0-9]/,
		''
	)}`;
};

const svelteDefaultValuesTemplate = (components: JoinedDefinition[]) => `
${defsTemplate(components)}

${components
	.map((component) => {
		return component.props
			.filter((prop) => !prop.isEventListener && prop.demoDefaultValue)
			.map((prop) => {
				return `let ${getPropDefaultValueName(
					prop,
					component
				)} = ${getSanitizedComponentName(
					component
				)}Defaults.ReferencedTypes['${prop.name}DemoDefaultValue'];`;
			})
			.join('\n');
	})
	.join('\n')}
`;

const visibilityToggleTemplate = (components: JoinedDefinition[]) => `
	${components
		.map((component) => {
			return `let ${getSanitizedComponentName(
				component
			)}Visible = false;`;
		})
		.join('\n')}
`;

const visibilitySetterTemplate = (components: JoinedDefinition[]) => `
	window.setVisibleComponent = (name: string, visible: boolean) => {
		switch (name) {
			${components
				.map((component) => {
					return `case '${component.component.name}':
					${getSanitizedComponentName(component)}Visible = visible;
					break;`;
				})
				.join('\n')}
		}
	}
`;

const scriptTemplate = (components: JoinedDefinition[]) => `
	<script lang="ts">
		import { ${components
			.map((component) => {
				return getComponentName(component);
			})
			.join(', ')} } from '../../packages/svelte';

			${visibilitySetterTemplate(components)}

			${svelteDefaultValuesTemplate(components)}

			${visibilityToggleTemplate(components)}
	</script>
`;

const htmlTemplate = (components: JoinedDefinition[]) => `
		${components
			.map((component) => {
				return `{#if ${getSanitizedComponentName(component)}Visible}
				<${getComponentName(component)} ${component.props
					.filter(
						(prop) => !prop.isEventListener && prop.demoDefaultValue
					)
					.map((prop) => {
						return `${prop.name}={${getPropDefaultValueName(
							prop,
							component
						)}}`;
					})
					.join(' ')} ${ifTrue('/', !component.hasChildren)}>${ifTrue(
					`Content </${getComponentName(component)}>`,
					component.hasChildren
				)}
				{/if}`;
			})
			.join('\n\n')}
`;

export async function getRenderTimeSvelteTemplate() {
	const components = await getJoinedComponentDefs();
	return `${scriptTemplate(components)}
	${htmlTemplate(components)}`;
}
