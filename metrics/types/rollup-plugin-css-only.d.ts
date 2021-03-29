declare module 'rollup-plugin-css-only' {
	function cssOnly(options: { output: string }): import('rollup').Plugin;

	export default cssOnly;
}
