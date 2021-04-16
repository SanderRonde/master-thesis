import { createComponentGetter } from '../../shared/get-components';

export const getComponents = createComponentGetter({
	packagesPath: 'packages',
	filters: {
		dirOnly: true,
		ignored: [
			'__mocks__',
			'theme-chalk',
			'utils',
			'element-plus',
			'directives',
			'hooks',
			'loading',
			'locale',
			'option',
			'popover',
			'row',
			'select',
			'table-column',
			'test-utils',
		],
	},
	componentName: 'sameAsDir',
	fileName: {
		initialFileStrategy: {
			type: 'fileName',
			fileName: 'index.ts',
		},
		specificFileStrategy: {
			type: 'matches',
			matches: [/^\.\/src/, /\.vue$/],
		},
		overrides: {
			'time-picker': './src/time-picker.ts',
		},
	},
});
