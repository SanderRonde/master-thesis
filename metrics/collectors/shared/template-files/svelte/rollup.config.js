import svelte from 'rollup-plugin-svelte';
import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import { terser } from 'rollup-plugin-terser';
import sveltePreprocess from 'svelte-preprocess';
import typescript from '@rollup/plugin-typescript';
import scss from 'rollup-plugin-scss';

export default {
	input: './demo.js',
	output: {
		sourcemap: false,
		format: 'iife',
		name: 'app',
		file: './demo.bundle.js',
	},
	plugins: [
		svelte({
			preprocess: sveltePreprocess({ sourceMap: false }),
			compilerOptions: {
				dev: false,
			},
		}),
		scss({
			output: 'demo.css',
			include: ['**.scss', '**.css', './node_modules/**/*.scss'],
			exclude: ['demo.css']
		}),
		resolve({
			mainFields: ['module', 'main', 'browser'],
			moduleDirectories: ['./node_modules'],
			dedupe: ['svelte'],
		}),
		commonjs(),
		typescript({
			sourceMap: false,
			inlineSources: false,
		}),
		terser(),
	],
};
