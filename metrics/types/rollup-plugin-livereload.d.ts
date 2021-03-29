declare module 'rollup-plugin-livereload' {
	function liveReload(dir: string): import('rollup').Plugin;

	export default liveReload;
}
