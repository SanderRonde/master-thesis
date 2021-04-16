import * as path from 'path';
import { SUBMODULES_DIR } from '../../shared/constants';
import { createComponentGetter } from '../../shared/get-components';

export const getComponents = createComponentGetter({
	packagesPath: 'src',
	filters: {
		dirOnly: true,
		ignored: ['test', 'util'],
	},
	componentName: 'sameAsDir',
	fileName: {
		caseInSensitive: true,
		initialFileStrategy: {
			type: 'custom',
			getFile: (dirName) => `${dirName}.ts`,
		},
		overrides: {
			buttons: 'checkbox.ts',
		},
	},
});

getComponents(path.join(SUBMODULES_DIR, 'ng-bootstrap')).then(console.log);