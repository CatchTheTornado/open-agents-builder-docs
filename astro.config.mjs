// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
	vite: {
		server: {
		  allowedHosts: ['docs.openagentsbuilder.com']
		},
		preview: {
			allowedHosts: ['docs.openagentsbuilder.com']
		}
	  },	
	integrations: [
		starlight({
			title: 'Open Agents Builder',
			social: {
				github: 'https://github.com/CatchTheTornado/open-agents-builder',
			},
			sidebar: [
				{
					label: 'Guides',
					autogenerate: { directory: 'guides' }
				},
				{
					label: 'API Docs',
					autogenerate: { directory: 'api' },
				},
				{
					label: 'Extensions',
					autogenerate: { directory: 'extensibility' },
				},				
			],
		}),
	],
});
