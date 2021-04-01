import { getJoinedComponentDefs } from '../../dashboard/lib/render-time/generate-render-time-page';
import { getComponentSelector } from '../../../../submodules/30mhz-dashboard/src/lib/design-library-wrappers/angular/scripts/lib/templates/component-template';
import {
	DEFAULT_VALUE_PREFIX,
	getSanitizedComponentName,
	VISIBLE_VALUES_PREFIX,
} from '../../dashboard/lib/render-time/lib/generate-render-time-html';

export async function getRenderTimeHTMLTemplate() {
	const components = await getJoinedComponentDefs();
	return `<div style="margin: 100px;">${(
		await Promise.all(
			components.map(async (component) => {
				return `<div *ngIf="${VISIBLE_VALUES_PREFIX}.${
					component.component.name
				}"><${getComponentSelector(component.tagName)} ${component.props
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
					.join(' ')}>${
					component.hasChildren ? 'content' : ''
				}</${getComponentSelector(component.tagName)}></div>`;
			})
		)
	).join('\n')}</div>`;
}
