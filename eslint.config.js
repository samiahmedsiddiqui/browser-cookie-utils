import js from '@eslint/js';
import prettierPlugin from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';

export default [
	js.configs.recommended,
	prettierConfig,

	{
		files: ['src/**/*.js'],
		languageOptions: {
			ecmaVersion: 'latest',
			sourceType: 'module',
			globals: {
				window: 'readonly',
				document: 'readonly'
			}
		},
		plugins: {
			prettier: prettierPlugin
		},
		rules: {
			'prettier/prettier': 'error',
			'no-var': 'error',
			'prefer-const': 'error',
			'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }]
		}
	},

	{
		files: ['build.js', 'test/**/*.js'],
		languageOptions: {
			ecmaVersion: 'latest',
			sourceType: 'module',
			globals: {
				console: 'readonly',
				process: 'readonly',
				globalThis: 'readonly',
				window: 'writable',
				document: 'writable'
			}
		},
		plugins: {
			prettier: prettierPlugin
		},
		rules: {
			'prettier/prettier': 'error'
		}
	},

	{
		ignores: ['dist/**', 'node_modules/**']
	}
];
