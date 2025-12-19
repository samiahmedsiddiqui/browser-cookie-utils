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
			sourceType: 'script',
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
		ignores: ['dist/**', 'node_modules/**']
	}
];
