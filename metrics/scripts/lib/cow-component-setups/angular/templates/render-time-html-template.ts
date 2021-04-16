import { getComponentSelector } from '../../../../../submodules/30mhz-dashboard/src/lib/design-library-wrappers/angular/scripts/lib/templates/component-template';
import {
	DEFAULT_VALUE_PREFIX,
	getSanitizedComponentName,
	VISIBLE_VALUES_PREFIX,
} from '../../../../../collectors/shared/dashboard/generate-render-time-html';
import { getJoinedComponentDefs } from '../../../../../collectors/shared/dashboard/generate-render-time-page';

export async function getRenderTimeHTMLTemplate(submoduleName: string) {
	const components = await getJoinedComponentDefs(submoduleName);
	return `<div style="margin: 100px;">${(
		await Promise.all(
			components.map(async (component) => {
				return `<div *ngIf="${VISIBLE_VALUES_PREFIX}.${
					component.component.name
				}.length"><div *ngFor="let a of ${VISIBLE_VALUES_PREFIX}.${
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
				}</${getComponentSelector(component.tagName)}></div></div>`;
			})
		)
	).join('\n')}</div>`;
}
