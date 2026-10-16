import { defineConfig, globalIgnores } from 'eslint/config';
import js from '@eslint/js';
import globals from 'globals';
import prettierRecommended from 'eslint-plugin-prettier/recommended';

export default defineConfig([
	globalIgnores([
		'.claude/',
		'dist/',
		'node_modules/',
		'docs/.vitepress/{cache,dist}/'
	]),

	{
		files: ['**/*.{js,mjs}'],
		extends: [js.configs.recommended],
		languageOptions: {
			ecmaVersion: 'latest',
			sourceType: 'module'
		},
		rules: {
			'no-var': 'error',
			'prefer-const': 'error',
			'no-unused-vars': ['error', { argsIgnorePattern: '^_' }]
		}
	},

	// Library source: browser globals, syntax up to ES2019 (no transpiler).
	{
		files: ['src/**/*.js'],
		languageOptions: {
			ecmaVersion: 2019,
			globals: globals.browser
		}
	},

	// Tooling and tests run in Node; tests mock `window` / `document`.
	{
		files: [
			'build.js',
			'eslint.config.js',
			'docs/.vitepress/*.mjs',
			'test/**/*.js'
		],
		languageOptions: {
			globals: {
				...globals.node,
				window: 'writable',
				document: 'writable'
			}
		}
	},

	prettierRecommended
]);
