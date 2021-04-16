import { createComponentGetter } from '../../shared/get-components';

export const getComponents = createComponentGetter({
	packagesPath: 'packages/vuetify/src/components',
	filters: {
		dirOnly: true,
		ignored: ['VGrid', 'transitions'],
	},
	componentName: 'sameAsDir',
	fileName: {
		caseInSensitive: true,
		initialFileStrategy: {
			type: 'custom',
			getFile: (dirName) => `${dirName}.ts`,
		},
	},
});
