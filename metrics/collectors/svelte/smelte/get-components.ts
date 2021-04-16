import { createComponentGetter } from '../../shared/get-components';

export const getComponents = createComponentGetter({
	packagesPath: 'src/components',
	filters: {
		dirOnly: true,
		ignored: ['Util'],
	},
	componentName: 'sameAsDir',
	fileName: {
		caseInSensitive: true,
		initialFileStrategy: {
			type: 'custom',
			getFile: (dirName) => `${dirName}.svelte`,
		},
	},
});
