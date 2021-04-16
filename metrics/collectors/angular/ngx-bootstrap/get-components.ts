import { createComponentGetter } from '../../shared/get-components';

export const getComponents = createComponentGetter({
	packagesPath: 'src',
	filters: {
		dirOnly: true,
		ignored: ['test', 'util'],
	},
	componentName: 'sameAsDir',
	multipleFiles: {
		type: 'matches',
		matches: [/\.component\.ts$/, /\.directive\.ts$/],
	},
});
