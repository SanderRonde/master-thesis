export const SET_RENDER_OPTION_FUNCTION_NAME = 'setRenderOption';

export const SET_RENDER_OPTION_FUNCTION_SIGNATURE = `(name: string, value: boolean)`;

export const SET_RENDER_OPTION_TEMPLATE = `public ${SET_RENDER_OPTION_FUNCTION_NAME}${SET_RENDER_OPTION_FUNCTION_SIGNATURE} {
	this.visible[name] = value;
	this._cd.detectChanges();
}`;
