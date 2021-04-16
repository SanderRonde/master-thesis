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
	multipleFiles: {
		type: 'matches',
		matches: [/\.component\.ts$/, /\.directive\.ts$/],
	},
});

getComponents(path.join(SUBMODULES_DIR, 'ngx-bootstrap')).then(console.log);
