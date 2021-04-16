import { createComponentGetter } from '../../shared/get-components';

export const getComponents = createComponentGetter({
	packagesPath: 'src/components',
	filters: {
		dirOnly: true,
		ignored: [
			'badgedirective',
			'api',
			'common',
			'config',
			'confirmationeventbus',
			'confirmationservice',
			'overlayeventbus',
			'ripple',
			'terminalservice',
			'toasteventbus',
			'toastservice',
			'tooltip',
			'useconfirm',
			'usetoast',
			'utils',
		],
	},
	componentName: 'sameAsDir',
	fileName: {
		caseInSensitive: true,
		initialFileStrategy: {
			type: 'custom',
			getFile: (dirName) => `${dirName}.vue`,
		},
	},
});
