import { createComponentGetter } from '../../shared/get-components';

export const getComponents = createComponentGetter({
	packagesPath: 'src',
	filters: {
		fileOnly: true,
		startsWithUppercase: true,
	},
	componentName: 'sameAsDir',
});
