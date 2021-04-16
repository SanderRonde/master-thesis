import { createComponentGetter } from '../../shared/get-components';

export const getComponents = createComponentGetter({
	packagesPath: 'packages/web-components/fast-components/src',
	filters: {
		dirOnly: true,
		ignored: ['utilities', '__test__', 'color', 'styles'],
	},
	componentName: 'sameAsDir',
	fileName: {
		caseInSensitive: true,
		initialFileStrategy: {
			type: 'fileName',
			fileName: 'index.ts',
		},
	},
});
