import { defineConfig } from 'vitepress';

const repo = 'https://github.com/samiahmedsiddiqui/browser-cookie-utils';

export default defineConfig({
	title: 'browser-cookie-utils',
	description:
		'Lightweight, dependency-free helpers for getting, setting and deleting browser cookies.',
	base: '/browser-cookie-utils/',
	cleanUrls: true,
	lastUpdated: true,
	head: [['meta', { name: 'theme-color', content: '#3c8772' }]],

	themeConfig: {
		nav: [
			{ text: 'Guide', link: '/guide/getting-started' },
			{ text: 'API', link: '/api' },
			{ text: 'Roadmap', link: '/roadmap' },
			{ text: 'Changelog', link: '/changelog' }
		],

		sidebar: [
			{
				text: 'Introduction',
				items: [
					{ text: 'Getting started', link: '/guide/getting-started' },
					{ text: 'TypeScript', link: '/guide/typescript' }
				]
			},
			{
				text: 'Guide',
				items: [
					{ text: 'Setting cookies', link: '/guide/setting-cookies' },
					{ text: 'Reading cookies', link: '/guide/reading-cookies' },
					{ text: 'Deleting cookies', link: '/guide/deleting-cookies' },
					{ text: 'JSON cookies', link: '/guide/json-cookies' },
					{ text: 'Watching cookies', link: '/guide/watching-cookies' },
					{ text: 'Custom encoding', link: '/guide/encoding' },
					{ text: 'Default options', link: '/guide/default-options' }
				]
			},
			{
				text: 'Reference',
				items: [
					{ text: 'API', link: '/api' },
					{ text: 'Security', link: '/guide/security' },
					{ text: 'Migration (v1 → v2)', link: '/guide/migration' }
				]
			},
			{
				text: 'Project',
				items: [
					{ text: 'Roadmap', link: '/roadmap' },
					{ text: 'Changelog', link: '/changelog' }
				]
			}
		],

		socialLinks: [
			{ icon: 'github', link: repo },
			{
				icon: 'linkedin',
				link: 'https://www.linkedin.com/in/sami-ahmed-siddiqui/',
				ariaLabel: 'Author on LinkedIn'
			},
			{
				icon: 'npm',
				link: 'https://www.npmjs.com/package/browser-cookie-utils'
			}
		],

		search: { provider: 'local' },

		editLink: {
			pattern: `${repo}/edit/main/docs/:path`,
			text: 'Edit this page on GitHub'
		},

		footer: {
			message: 'Released under the MIT License.',
			copyright:
				'Copyright © <a href="https://www.linkedin.com/in/sami-ahmed-siddiqui/">Sami Ahmed Siddiqui</a>'
		}
	}
});
