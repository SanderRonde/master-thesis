export const setRenderOptionTemplate = `public setRenderOption(name: string, value: boolean) {
	this.visible[name] = value;
	this._cd.detectChanges();
}`;
