import * as path from 'path';
import { extractComponentTypes } from '../../../../../submodules/30mhz-dashboard/src/lib/design-library-wrappers/build/scripts/lib/extract-component-types';
import { getNamedCowComponents } from '../../../../../submodules/30mhz-dashboard/src/lib/design-library-wrappers/build/scripts/lib/extract-cow-tag-names';
import { createReactComponent } from '../../../../../submodules/30mhz-dashboard/src/lib/design-library-wrappers/react/scripts/lib/create-react-component';
import {
	defaultValuesTemplate,
	getNamespacedPropDemoDefaultValueName,
} from '../../../../../submodules/30mhz-dashboard/src/lib/storybook/scripts/lib/templates/default-values-template';
import { DASHBOARD_DIR } from '../../../../shared/constants';
import { transformFile, writeFile } from '../../../../shared/files';

import { runFunctionIfCalledFromScript } from '../../../../shared/helpers';
import { info, success } from '../../../../shared/log';
import { EXCLUDED_COMPONENTS } from '../get-components';
import {
	DEFAULT_VALUE_PREFIX,
	generateRenderTimeHTML,
	getSanitizedComponentName,
	VISIBLE_VALUES_PREFIX,
} from './lib/generate-render-time-html';
import { JoinedDefinition } from './lib/get-component-tag';
import { chartRandomTemplate } from './templates/chart-random';
import { SET_RENDER_OPTION_TEMPLATE } from './templates/set-render-option';

const SHARED_MODULE_FILE_PATH = path.join(
	DASHBOARD_DIR,
	'src/app/shared/shared.module.ts'
);
const APP_MODULE_FILE_PATH = path.join(DASHBOARD_DIR, 'src/app/app.module.ts');
const NOT_FOUND_COMPONENT_BASE = path.join(DASHBOARD_DIR, 'src/app/shared/404');
const HACK_CSS_FILE_PATH = path.join(DASHBOARD_DIR, 'src/styles/hack.scss');
const NOT_FOUND_COMPONENT_HTML = path.join(
	NOT_FOUND_COMPONENT_BASE,
	'404.component.html'
);
const NOT_FOUND_COMPONENT_TS = path.join(
	NOT_FOUND_COMPONENT_BASE,
	'404.component.ts'
);
const CHART_COMPONENT = path.join(
	DASHBOARD_DIR,
	'src/app/charts/modular-chart/modular-chart.demo.state.ts'
);
const WEBCOMPONENTS_ENV_FILE = path.join(
	DASHBOARD_DIR,
	'src/environments/webcomponent.ts'
);

async function addBrowserModule() {
	await transformFile(SHARED_MODULE_FILE_PATH, (content) => {
		const importAdded = `import { BrowserModule } from '@angular/platform-browser';\n${content}`;
		const importUsed = importAdded.replace(
			/NgSelectModule,/,
			'NgSelectModule, BrowserModule,'
		);
		return importUsed;
	});
}

async function disableSupportButton() {
	await transformFile(HACK_CSS_FILE_PATH, (content) => {
		return `${content}\niframe { display: none; } page-not-found { margin-top: 0!important; }`;
	});
}

/**
 * Currently the chart uses a randomly generated
 * demo line. We want to make this deterministic
 * so we can actually test when it's rendered
 */
export async function makeChartDeterministic() {
	await transformFile(CHART_COMPONENT, (content) => {
		const randomFunctionStart = content.indexOf('private _randomBetween');
		const randomFunctionEnd =
			content.slice(randomFunctionStart).indexOf('}') +
			randomFunctionStart;

		const replacedFunction =
			content.slice(0, randomFunctionStart) +
			chartRandomTemplate +
			content.slice(randomFunctionEnd + 1);
		return replacedFunction;
	});
}

async function writeRenderTimeHTML(html: string) {
	const replacedFile = `
	<div class="vertical-align">
		<div class="vertical">${html}</div></div>`;
	await writeFile(NOT_FOUND_COMPONENT_HTML, replacedFile);
}

async function addChangeDetectorFunction() {
	await transformFile(NOT_FOUND_COMPONENT_TS, (content) => {
		// Add import
		content = `import { ChangeDetectorRef } from '@angular/core';\n${content}`;

		// Add to constructor
		content = content.replace(
			'private _elementRef: ElementRef',
			'private _elementRef: ElementRef, private _cd: ChangeDetectorRef'
		);

		// Add function for setting
		const classEndIndex = content.lastIndexOf('}');
		content =
			content.slice(0, classEndIndex) +
			SET_RENDER_OPTION_TEMPLATE +
			content.slice(classEndIndex);
		return content;
	});
}

export function getDefaultValuesString(components: JoinedDefinition[]) {
	let str: string = '';
	for (const component of components) {
		str = `namespace ${getSanitizedComponentName(
			component
		)}Default { export ${defaultValuesTemplate(component)} }\n${str}`;
	}
	return str;
}

async function addDefaultValuesToFile(components: JoinedDefinition[]) {
	await transformFile(NOT_FOUND_COMPONENT_TS, (content) => {
		return getDefaultValuesString(components) + content;
	});
}

export function getDefaultValuesClassString(components: JoinedDefinition[]) {
	return `public ${DEFAULT_VALUE_PREFIX} = {
		${components
			.map((component) => {
				const sanitizedName = getSanitizedComponentName(component);
				return `${sanitizedName}: {
				${component.props
					.filter(
						(prop) => !prop.isEventListener && prop.demoDefaultValue
					)
					.map((prop) => {
						return `'${
							prop.name
						}': ${sanitizedName}Default.${getNamespacedPropDemoDefaultValueName(
							prop
						)}`;
					})
					.join(',')}
			}`;
			})
			.join(',')}
	}`;
}

async function addDefaultValuesToClass(components: JoinedDefinition[]) {
	await transformFile(NOT_FOUND_COMPONENT_TS, (content) => {
		return content.replace(
			'satDiv: any;',
			`satDiv: any;\n
		${getDefaultValuesClassString(components)}`
		);
	});
}

export function getTogglesString(components: JoinedDefinition[]) {
	return `public ${VISIBLE_VALUES_PREFIX} = {
		${components.map((component) => {
			return `${component.component.name}: false`;
		})}
	}`;
}

async function addTogglesToClass(components: JoinedDefinition[]) {
	await transformFile(NOT_FOUND_COMPONENT_TS, (content) => {
		return content.replace(
			'satDiv: any;',
			`satDiv: any;\n
			${getTogglesString(components)}`
		);
	});
}

async function disableAuthentication() {
	await transformFile(WEBCOMPONENTS_ENV_FILE, (content) => {
		return content.replace(
			'USE_AUTHENTICATION = true;',
			'USE_AUTHENTICATION = false;'
		);
	});
}

async function remove404PageFromModule() {
	await transformFile(SHARED_MODULE_FILE_PATH, (content) => {
		return content.replace(/PageNotFoundComponent,/g, '');
	});
}

async function addToAppModule() {
	await transformFile(APP_MODULE_FILE_PATH, (content) => {
		// Add imports
		content = `import { PageNotFoundComponent } from './shared/404/404.component';\n${content}`;
		content = `import { AppsDataService } from './apps/apps-data.service';\n${content}`;

		// Add to declarations
		content = content.replace(
			'[AppComponent]',
			'[AppComponent, PageNotFoundComponent]'
		);

		// Add to exports
		content = content.replace(
			'exports: [],',
			'exports: [PageNotFoundComponent],'
		);

		// Add to providers
		content = content.replace(
			'AppReadyGuard,',
			'AppReadyGuard, AppsDataService,'
		);

		return content;
	});
}

export async function getJoinedComponentDefs(): Promise<JoinedDefinition[]> {
	const componentTypes = (
		await getNamedCowComponents(await extractComponentTypes())
	).filter(
		(component) => !EXCLUDED_COMPONENTS.includes(component.component.name)
	);

	const components = [
		...componentTypes.map((componentType) => ({
			...componentType,
			...createReactComponent(componentType),
			basicEvents: componentType.events,
		})),
	] as JoinedDefinition[];

	return components;
}

/**
 * We generate a test page that we can use to test
 * the render times of various components. We re-use
 * the 404 page for this because it has no automatic
 * redirect to the login page.
 */

runFunctionIfCalledFromScript(async () => {
	const tagName = 'generate-render-time-page';
	info(tagName, 'Getting browser module');
	await addBrowserModule();
	info(tagName, 'Adding to app module');
	await addToAppModule();
	info(tagName, 'Disabling support button');
	await disableSupportButton();
	info(tagName, 'Removing 404 page from shared module');
	await remove404PageFromModule();
	info(tagName, 'Making chart deterministic');
	await makeChartDeterministic();
	info(tagName, 'Getting component defs');
	const componentDefs = await getJoinedComponentDefs();
	info(tagName, 'Generating render timing html');
	const renderTimeHTML = await generateRenderTimeHTML(componentDefs);
	info(tagName, 'Writing render timing HTML');
	await writeRenderTimeHTML(renderTimeHTML);
	info(tagName, 'Adding change detector function');
	await addChangeDetectorFunction();
	info(tagName, 'Adding default values to file');
	await addDefaultValuesToFile(componentDefs);
	info(tagName, 'Adding default values to class');
	await addDefaultValuesToClass(componentDefs);
	info(tagName, 'Disabling authentication');
	await disableAuthentication();
	info(tagName, 'Adding toggles to class');
	await addTogglesToClass(componentDefs);
	success(tagName, 'Done generating render timing page');
}, __filename);
