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
		ignores: ['build.js', 'dist/**', 'node_modules/**']
	}
];
