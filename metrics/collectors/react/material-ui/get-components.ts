import { createComponentGetter } from '../../shared/get-components';

export const getComponents = createComponentGetter({
	packagesPath: 'packages/material-ui/src',
	filters: {
		dirOnly: true,
		startsWithUppercase: true,
		ignored: [
			'ClickAwayListener',
			'Portal',
			'StyledEngineProvider',
			'Unstable_TrapFocus',
		],
	},
	componentName: 'sameAsDir',
	fileName: {
		caseInSensitive: true,
		initialFileStrategy: {
			type: 'custom',
			getFile: (dirName) => `${dirName}.js`,
		},
	},
});
