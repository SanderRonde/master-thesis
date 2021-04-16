import { createComponentGetter } from '../../shared/get-components';

export const getComponents = createComponentGetter({
	packagesPath: 'packages/core/src',
	filters: {
		dirOnly: true,
		ignored: [
			'forms',
			'internal',
			'internal-components',
			'list',
			'styles',
			'test',
		],
	},
	componentName: 'sameAsDir',
	fileName: {
		caseInSensitive: true,
		initialFileStrategy: {
			type: 'custom',
			getFile: (dirName) => `${dirName}.element.ts`,
		},
	},
});
