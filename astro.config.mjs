// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import node from '@astrojs/node';

// https://astro.build/config
export default defineConfig({
	output: 'server',
	adapter: node({
	  mode: 'middleware',
	}),	
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
			customCss: [
				// Relative path to your custom CSS file
				'./src/styles/custom.css',
			  ],			
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
