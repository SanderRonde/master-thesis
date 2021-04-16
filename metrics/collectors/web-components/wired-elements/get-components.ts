import { createComponentGetter } from '../../shared/get-components';

export const getComponents = createComponentGetter({
	packagesPath: 'packages',
	filters: {
		dirOnly: true,
		ignored: ['wired-lib'],
		startsWith: 'wired-',
	},
	componentName: 'sameAsDir',
	fileName: {
		caseInSensitive: false,
		initialFileStrategy: {
			type: 'custom',
			getFile: (dirName) => `src/${dirName}.ts`,
		},
	},
});
