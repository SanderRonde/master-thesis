import { createComponentGetter } from '../../shared/get-components';

export const getComponents = createComponentGetter({
	packagesPath: 'core/src/elements',
	filters: {
		doesNotEndWith: '.spec.js',
		ignored: ['base'],
	},
	componentName: 'sameAsDir',
	fileName: {
		initialFileStrategy: {
			type: 'fileName',
			fileName: 'index.js',
		},
	},
});
