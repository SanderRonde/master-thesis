import { createComponentGetter } from '../../shared/get-components';

export const getComponents = createComponentGetter({
	packagesPath: 'src',
	filters: {
		dirOnly: true,
		ignored: ['test', 'util'],
	},
	componentName: 'sameAsDir',
	fileName: {
		caseInSensitive: true,
		initialFileStrategy: {
			type: 'custom',
			getFile: (dirName) => `${dirName}.ts`,
		},
		overrides: {
			buttons: 'checkbox.ts',
		},
	},
});
