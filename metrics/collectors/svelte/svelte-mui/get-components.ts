import { createComponentGetter } from '../../shared/get-components';

export const getComponents = createComponentGetter({
	packagesPath: 'src',
	filters: {
		fileOnly: true,
		endsWith: '.svelte',
		ignored: ['Util'],
	},
	componentName: 'sameAsDir',
});
