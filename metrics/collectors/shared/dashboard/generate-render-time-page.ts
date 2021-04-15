import * as path from 'path';
import { EXCLUDED_COMPONENTS } from '../../../scripts/lib/cow-component-setups/dashboard/dashboard';
import { extractComponentTypes } from '../../../submodules/30mhz-dashboard/src/lib/design-library-wrappers/build/scripts/lib/extract-component-types';
import { getNamedCowComponents } from '../../../submodules/30mhz-dashboard/src/lib/design-library-wrappers/build/scripts/lib/extract-cow-tag-names';
import { createReactComponent } from '../../../submodules/30mhz-dashboard/src/lib/design-library-wrappers/react/scripts/lib/create-react-component';
import {
	defaultValuesTemplate,
	getNamespacedPropDemoDefaultValueName,
} from '../../../submodules/30mhz-dashboard/src/lib/storybook/scripts/lib/templates/default-values-template';
import { SUBMODULES_DIR } from '../constants';
import { transformFile, writeFile } from '../files';
import { info, success } from '../log';
import { chartRandomTemplate } from '../template-files/dashboard/chart-random';
import { SET_RENDER_OPTION_TEMPLATE } from '../template-files/dashboard/set-render-option';
import {
	DEFAULT_VALUE_PREFIX,
	generateRenderTimeHTML,
	getSanitizedComponentName,
	VISIBLE_VALUES_PREFIX,
} from './generate-render-time-html';
import { JoinedDefinition } from './get-component-tag';

type Dirs = ReturnType<typeof getRenderTimePageDirs>;

export function getRenderTimePageDirs(baseDir: string, submoduleName: string) {
	const sharedModuleFilePath = path.join(
		baseDir,
		'src/app/shared/shared.module.ts'
	);
	const appModuleFilePath = path.join(baseDir, 'src/app/app.module.ts');
	const notFoundComponentBase = path.join(baseDir, 'src/app/shared/404');
	const hackCSSFilePath = path.join(baseDir, 'src/styles/hack.scss');
	const notFoundComponentHTML = path.join(
		notFoundComponentBase,
		'404.component.html'
	);
	const notFoundComponentTs = path.join(
		notFoundComponentBase,
		'404.component.ts'
	);
	const chartComponent = path.join(
		baseDir,
		'src/app/charts/modular-chart/modular-chart.demo.state.ts'
	);
	const webcomponentsEnvFile = path.join(
		baseDir,
		'src/environments/webcomponent.ts'
	);

	return {
		sharedModuleFilePath,
		appModuleFilePath,
		notFoundComponentBase,
		hackCSSFilePath,
		notFoundComponentTs,
		notFoundComponentHTML,
		chartComponent,
		webcomponentsEnvFile,
		submodulePath: path.join(SUBMODULES_DIR, submoduleName),
	};
}

async function addBrowserModule(dirs: Dirs) {
	await transformFile(dirs.sharedModuleFilePath, (content) => {
		const importAdded = `import { BrowserModule } from '@angular/platform-browser';\n${content}`;
		const importUsed = importAdded.replace(
			/NgSelectModule,/,
			'NgSelectModule, BrowserModule,'
		);
		return importUsed;
	});
}

async function disableSupportButton(dirs: Dirs) {
	await transformFile(dirs.hackCSSFilePath, (content) => {
		return `${content}\niframe { display: none; } page-not-found { margin-top: 0!important; }`;
	});
}

/**
 * Currently the chart uses a randomly generated
 * demo line. We want to make this deterministic
 * so we can actually test when it's rendered
 */
export async function makeChartDeterministic(dirs: Dirs) {
	await transformFile(dirs.chartComponent, (content) => {
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

async function writeRenderTimeHTML(html: string, dirs: Dirs) {
	const replacedFile = `
	<div class="vertical-align">
		<div class="vertical">${html}</div></div>`;
	await writeFile(dirs.notFoundComponentHTML, replacedFile);
}

async function addChangeDetectorFunction(dirs: Dirs) {
	await transformFile(dirs.notFoundComponentTs, (content) => {
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

async function addDefaultValuesToFile(
	components: JoinedDefinition[],
	dirs: Dirs
) {
	await transformFile(dirs.notFoundComponentTs, (content) => {
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

async function addDefaultValuesToClass(
	components: JoinedDefinition[],
	dirs: Dirs
) {
	await transformFile(dirs.notFoundComponentTs, (content) => {
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

async function addTogglesToClass(components: JoinedDefinition[], dirs: Dirs) {
	await transformFile(dirs.notFoundComponentTs, (content) => {
		return content.replace(
			'satDiv: any;',
			`satDiv: any;\n
			${getTogglesString(components)}`
		);
	});
}

async function disableAuthentication(dirs: Dirs) {
	await transformFile(dirs.webcomponentsEnvFile, (content) => {
		return content.replace(
			'USE_AUTHENTICATION = true;',
			'USE_AUTHENTICATION = false;'
		);
	});
}

async function remove404PageFromModule(dirs: Dirs) {
	await transformFile(dirs.sharedModuleFilePath, (content) => {
		return content.replace(/PageNotFoundComponent,/g, '');
	});
}

async function addToAppModule(dirs: Dirs) {
	await transformFile(dirs.appModuleFilePath, (content) => {
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

export async function generateRenderTimePage(
	baseDir: string,
	submoduleName: string
) {
	const dirs = getRenderTimePageDirs(baseDir, submoduleName);

	const tagName = 'generate-render-time-page';
	info(tagName, 'Getting browser module');
	await addBrowserModule(dirs);
	info(tagName, 'Adding to app module');
	await addToAppModule(dirs);
	info(tagName, 'Disabling support button');
	await disableSupportButton(dirs);
	info(tagName, 'Removing 404 page from shared module');
	await remove404PageFromModule(dirs);
	info(tagName, 'Making chart deterministic');
	await makeChartDeterministic(dirs);
	info(tagName, 'Getting component defs');
	const componentDefs = await getJoinedComponentDefs();
	info(tagName, 'Generating render timing html');
	const renderTimeHTML = await generateRenderTimeHTML(
		componentDefs,
		dirs.submodulePath
	);
	info(tagName, 'Writing render timing HTML');
	await writeRenderTimeHTML(renderTimeHTML, dirs);
	info(tagName, 'Adding change detector function');
	await addChangeDetectorFunction(dirs);
	info(tagName, 'Adding default values to file');
	await addDefaultValuesToFile(componentDefs, dirs);
	info(tagName, 'Adding default values to class');
	await addDefaultValuesToClass(componentDefs, dirs);
	info(tagName, 'Disabling authentication');
	await disableAuthentication(dirs);
	info(tagName, 'Adding toggles to class');
	await addTogglesToClass(componentDefs, dirs);
	success(tagName, 'Done generating render timing page');
}
