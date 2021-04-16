import { createComponentGetter } from '../../shared/get-components';

export const getComponents = createComponentGetter({
	packagesPath: 'src/app/components',
	filters: {
		dirOnly: true,
		ignored: [
			'api',
			'common',
			'menuitem',
			'selectitem',
			'treenode',
			'utils',
			'dom',
		],
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
