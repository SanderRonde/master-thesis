import { createComponentGetter } from '../../shared/get-components';

export const getComponents = createComponentGetter({
	packagesPath: 'packages',
	filters: {
		dirOnly: true,
		ignored: ['common', 'ripple'],
	},
	componentName: 'sameAsDir',
	fileName: {
		caseInSensitive: true,
		initialFileStrategy: {
			type: 'custom',
			getFile: (dirName) => `${dirName.replace(/-/g, '')}.svelte`,
		},
		overrides: {
			chips: 'Chip.svelte',
		},
	},
});
