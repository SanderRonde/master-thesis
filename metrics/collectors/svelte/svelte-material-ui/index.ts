import { ComponentFiles } from '../../dashboard/lib/get-components';
import { UILibraryClass } from '../../shared/shapes';
import { getComponents } from './get-components';

export class SvelteMaterialUI extends UILibraryClass {
	static libraryName = 'svelte-material-ui';

	static async getComponents(): Promise<ComponentFiles[]> {
		return getComponents();
	}
}
