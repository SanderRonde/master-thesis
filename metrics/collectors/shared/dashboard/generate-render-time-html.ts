import { getComponents } from '../../../scripts/lib/cow-component-setups/dashboard/dashboard';
import { getComponentTag, JoinedDefinition } from './get-component-tag';

export const DEFAULT_VALUE_PREFIX = 'defaultValues';
export const VISIBLE_VALUES_PREFIX = 'visible';

const SELF_CLOSING_TAGS = [
	'area',
	'base',
	'br',
	' ol',
	'embed',
	'hr',
	'img',
	'input',
	'link',
	'meta',
	'param',
	'source',
	'track',
	'wbr',
];

export function getSanitizedComponentName(component: JoinedDefinition) {
	return component.tagName.replace(/[^a-zA-Z]/g, '');
}

export async function generateRenderTimeHTML(
	components: JoinedDefinition[],
	submodulePath: string
) {
	const cowComponents = await getComponents(submodulePath);
	const componentsHTML = await Promise.all(
		components.map(
			async (component) =>
				[
					component,
					await (async () => {
						const tagData = await getComponentTag(
							component,
							cowComponents
						);
						const isSelfClosing = SELF_CLOSING_TAGS.includes(
							tagData.tagName
						);
						return `<${tagData.tagName} ${tagData.attributes.join(
							' '
						)} ${component.props
							.filter((property) => {
								return (
									!property.isEventListener &&
									property.demoDefaultValue
								);
							})
							.map((property) => {
								return `[${
									property.name
								}]="${DEFAULT_VALUE_PREFIX}.${getSanitizedComponentName(
									component
								)}['${property.name}']"`;
							})
							.join(' ')} ${isSelfClosing ? '/' : ''}>${
							component.hasChildren ? 'content' : ''
						}${isSelfClosing ? '' : `</${tagData.tagName}>`}`;
					})(),
				] as const
		)
	);

	return componentsHTML
		.map(([component, html]) => {
			return `<div *ngIf="${VISIBLE_VALUES_PREFIX}.${component.component.name}">${html}</div>`;
		})
		.join('\n');
}
