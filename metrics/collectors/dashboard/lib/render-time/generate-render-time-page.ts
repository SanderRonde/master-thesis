import * as fs from 'fs-extra';
import * as path from 'path';
import { extractComponentTypes } from '../../../../submodules/30mhz-dashboard/src/lib/design-library-wrappers/build/scripts/lib/extract-component-types';
import { getNamedCowComponents } from '../../../../submodules/30mhz-dashboard/src/lib/design-library-wrappers/build/scripts/lib/extract-cow-tag-names';
import { createReactComponent } from '../../../../submodules/30mhz-dashboard/src/lib/design-library-wrappers/react/scripts/lib/create-react-component';
import {
	defaultValuesTemplate,
	getNamespacedPropDemoDefaultValueName,
} from '../../../../submodules/30mhz-dashboard/src/lib/storybook/scripts/lib/templates/default-values-template';
import { DASHBOARD_DIR } from '../../../shared/constants';

import { runFunctionIfCalledFromScript } from '../../../shared/helpers';
import { info, success } from '../../../shared/log';
import { EXCLUDED_COMPONENTS } from '../get-components';
import {
	DEFAULT_VALUE_PREFIX,
	generateRenderTimeHTML,
	getSanitizedComponentName,
	VISIBLE_VALUES_PREFIX,
} from './lib/generate-render-time-html';
import { JoinedDefinition } from './lib/get-component-tag';
import { chartRandomTemplate } from './templates/chart-random';
import { setRenderOptionTemplate } from './templates/set-render-option';

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
	const file = await fs.readFile(SHARED_MODULE_FILE_PATH, {
		encoding: 'utf8',
	});

	const importAdded = `import { BrowserModule } from '@angular/platform-browser';\n${file}`;
	const importUsed = importAdded.replace(
		/NgSelectModule,/,
		'NgSelectModule, BrowserModule,'
	);
	await fs.writeFile(SHARED_MODULE_FILE_PATH, importUsed, {
		encoding: 'utf8',
	});
}

async function disableSupportButton() {
	const file = await fs.readFile(HACK_CSS_FILE_PATH, {
		encoding: 'utf8',
	});

	await fs.writeFile(
		HACK_CSS_FILE_PATH,
		`${file}\niframe { display: none; }`,
		{
			encoding: 'utf8',
		}
	);
}

/**
 * Currently the chart uses a randomly generated
 * demo line. We want to make this deterministic
 * so we can actually test when it's rendered
 */
async function makeChartDeterministic() {
	const file = await fs.readFile(CHART_COMPONENT, {
		encoding: 'utf8',
	});

	const randomFunctionStart = file.indexOf('private _randomBetween');
	const randomFunctionEnd =
		file.slice(randomFunctionStart).indexOf('}') + randomFunctionStart;

	const replacedFunction =
		file.slice(0, randomFunctionStart) +
		chartRandomTemplate +
		file.slice(randomFunctionEnd + 1);
	await fs.writeFile(CHART_COMPONENT, replacedFunction, {
		encoding: 'utf8',
	});
}

async function writeRenderTimeHTML(html: string) {
	const replacedFile = `<div class="vertical-align">
		<div class="vertical">${html}</div></div>`;
	await fs.writeFile(NOT_FOUND_COMPONENT_HTML, replacedFile, {
		encoding: 'utf8',
	});
}

async function addChangeDetectorFunction() {
	let file = await fs.readFile(NOT_FOUND_COMPONENT_TS, {
		encoding: 'utf8',
	});

	// Add import
	file = `import { ChangeDetectorRef } from '@angular/core';\n${file}`;

	// Add to constructor
	file = file.replace(
		'private _elementRef: ElementRef',
		'private _elementRef: ElementRef, private _cd: ChangeDetectorRef'
	);

	// Add function for setting
	const classEndIndex = file.lastIndexOf('}');
	file =
		file.slice(0, classEndIndex) +
		setRenderOptionTemplate +
		file.slice(classEndIndex);

	await fs.writeFile(NOT_FOUND_COMPONENT_TS, file, {
		encoding: 'utf8',
	});
}

async function addDefaultValuesToFile(components: JoinedDefinition[]) {
	let file = await fs.readFile(NOT_FOUND_COMPONENT_TS, {
		encoding: 'utf8',
	});

	for (const component of components) {
		file = `namespace ${getSanitizedComponentName(
			component
		)}Default { export ${defaultValuesTemplate(component)} }\n${file}`;
	}

	await fs.writeFile(NOT_FOUND_COMPONENT_TS, file, {
		encoding: 'utf8',
	});
}

async function addDefaultValuesToClass(components: JoinedDefinition[]) {
	let file = await fs.readFile(NOT_FOUND_COMPONENT_TS, {
		encoding: 'utf8',
	});

	file = file.replace(
		'satDiv: any;',
		`satDiv: any;\n
	public ${DEFAULT_VALUE_PREFIX} = {
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
	}`
	);

	await fs.writeFile(NOT_FOUND_COMPONENT_TS, file, {
		encoding: 'utf8',
	});
}

async function addTogglesToClass(components: JoinedDefinition[]) {
	let file = await fs.readFile(NOT_FOUND_COMPONENT_TS, {
		encoding: 'utf8',
	});

	file = file.replace(
		'satDiv: any;',
		`satDiv: any;\n
	public ${VISIBLE_VALUES_PREFIX} = {
		${components.map((component) => {
			return `${component.component.name}: false`;
		})}
	}`
	);

	await fs.writeFile(NOT_FOUND_COMPONENT_TS, file, {
		encoding: 'utf8',
	});
}

async function disableAuthentication() {
	let file = await fs.readFile(WEBCOMPONENTS_ENV_FILE, {
		encoding: 'utf8',
	});

	file = file.replace(
		'USE_AUTHENTICATION = true;',
		'USE_AUTHENTICATION = false;'
	);

	await fs.writeFile(WEBCOMPONENTS_ENV_FILE, file, {
		encoding: 'utf8',
	});
}

async function remove404PageFromModule() {
	let file = await fs.readFile(SHARED_MODULE_FILE_PATH, {
		encoding: 'utf8',
	});

	file = file.replace(/PageNotFoundComponent,/g, '');

	await fs.writeFile(SHARED_MODULE_FILE_PATH, file, {
		encoding: 'utf8',
	});
}

async function addToAppModule() {
	let file = await fs.readFile(APP_MODULE_FILE_PATH, {
		encoding: 'utf8',
	});

	// Add imports
	file = `import { PageNotFoundComponent } from './shared/404/404.component';\n${file}`;
	file = `import { AppsDataService } from './apps/apps-data.service';\n${file}`;

	// Add to declarations
	file = file.replace(
		'[AppComponent]',
		'[AppComponent, PageNotFoundComponent]'
	);

	// Add to exports
	file = file.replace('exports: [],', 'exports: [PageNotFoundComponent],');

	// Add to providers
	file = file.replace('AppReadyGuard,', 'AppReadyGuard, AppsDataService,');

	await fs.writeFile(APP_MODULE_FILE_PATH, file, {
		encoding: 'utf8',
	});
}

async function getComponentDefs(): Promise<JoinedDefinition[]> {
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
	info(__filename, 'Getting browser module');
	await addBrowserModule();
	info(__filename, 'Adding to app module');
	await addToAppModule();
	info(__filename, 'Disabling support button');
	await disableSupportButton();
	info(__filename, 'Removing 404 page from shared module');
	await remove404PageFromModule();
	info(__filename, 'Making chart deterministic');
	await makeChartDeterministic();
	info(__filename, 'Getting component defs');
	const componentDefs = await getComponentDefs();
	info(__filename, 'Generating render timing html');
	const renderTimeHTML = await generateRenderTimeHTML(componentDefs);
	info(__filename, 'Writing render timing HTML');
	await writeRenderTimeHTML(renderTimeHTML);
	info(__filename, 'Adding change detector function');
	await addChangeDetectorFunction();
	info(__filename, 'Adding default values to file');
	await addDefaultValuesToFile(componentDefs);
	info(__filename, 'Adding default values to class');
	await addDefaultValuesToClass(componentDefs);
	info(__filename, 'Disabling authentication');
	await disableAuthentication();
	info(__filename, 'Adding toggles to class');
	await addTogglesToClass(componentDefs);
	success(__filename, 'Done generating render timing page');
}, __filename);
