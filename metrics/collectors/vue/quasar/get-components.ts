import { createComponentGetter } from '../../shared/get-components';

export const getComponents = createComponentGetter({
	packagesPath: 'ui/src/components',
	filters: {
		dirOnly: true,
		ignored: ['dialog-bottom-sheet', 'dialog-plugin'],
	},
	componentName: 'sameAsDir',
	fileName: {
		caseInSensitive: true,
		initialFileStrategy: {
			type: 'custom',
			getFile: (dirName) =>
				`Q${dirName[0].toUpperCase()}${dirName
					.slice(1)
					.replace(/-/g, '')}.js`,
		},
		overrides: {
			chat: 'QChatMessage.js',
		},
	},
});
