import {
	getDefaultValuesClassString,
	getDefaultValuesString,
	getJoinedComponentDefs,
	getTogglesString,
} from '../../../../../collectors/shared/dashboard/generate-render-time-page';
import {
	SET_RENDER_OPTION_FUNCTION_NAME,
	SET_RENDER_OPTION_FUNCTION_SIGNATURE,
	SET_RENDER_OPTION_TEMPLATE,
} from '../../../../../collectors/shared/template-files/dashboard/set-render-option';

export async function getRenderTimeJsTemplate(submoduleName: string) {
	const components = await getJoinedComponentDefs(submoduleName);
	return `
	import { Component, ChangeDetectorRef, ElementRef } from '@angular/core';
	
	${getDefaultValuesString(components)}

	@Component({
		selector: 'app-root',
		templateUrl: './metrics.component.html',
	})
	export class AppComponent {
		constructor(private _cd: ChangeDetectorRef, private _elementRef: ElementRef) {
			if (_elementRef.nativeElement) {
				_elementRef.nativeElement.${SET_RENDER_OPTION_FUNCTION_NAME} = ${SET_RENDER_OPTION_FUNCTION_SIGNATURE} => this.${SET_RENDER_OPTION_FUNCTION_NAME}(name, value);
			}

			(window as any).setVisibleComponent = (componentName, numberOfComponents) => {
				this.${SET_RENDER_OPTION_FUNCTION_NAME}(componentName, numberOfComponents);
			}
		}
		
		${getDefaultValuesClassString(components)}

		${getTogglesString(components)}

		${SET_RENDER_OPTION_TEMPLATE}
	}

	(window as any).availableComponents = [${components
		.map((component) => `'${component.component.name}'`)
		.join(', ')}]
	`;
}
