import { ComponentFiles } from '../../metric-definitions/types';
import { getComponents as getOnsenComponents } from '../onsen-shared/get-components';

export async function getComponents(
	submodulePath: string
): Promise<ComponentFiles[]> {
	return getOnsenComponents(submodulePath);
}
