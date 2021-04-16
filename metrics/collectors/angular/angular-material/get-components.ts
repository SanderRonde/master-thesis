import { createComponentGetter } from '../../shared/get-components';

export const getComponents = createComponentGetter({
	packagesPath: 'src/material',
	filters: {
		dirOnly: true,
		ignored: [
			'core',
			'expansion',
			'prebuilt-themes',
			'schematics',
			'testing',
		],
	},
	componentName: 'sameAsDir',
	fileName: {
		caseInSensitive: true,
		initialFileStrategy: {
			type: 'custom',
			getFile: (dirName) => `${dirName}.ts`,
		},
		overrides: {
			chips: 'chip.ts',
			tabs: 'tab.ts',
		},
	},
});
