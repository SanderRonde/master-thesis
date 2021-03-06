export const SET_RENDER_OPTION_FUNCTION_NAME = 'setRenderOption';

export const SET_RENDER_OPTION_FUNCTION_SIGNATURE = `(name: string, numberOfComponents: number)`;

export const SET_RENDER_OPTION_TEMPLATE = `public ${SET_RENDER_OPTION_FUNCTION_NAME}${SET_RENDER_OPTION_FUNCTION_SIGNATURE} {
	this.visible[name] = new Array(numberOfComponents).fill('');
	this._cd.detectChanges();
}`;
