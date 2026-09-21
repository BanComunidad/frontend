import adapter from '@sveltejs/adapter-netlify';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	kit: {
		// BFF sobre Netlify Functions (Node). El server-side (cookies httpOnly,
		// $env/dynamic/private) corre como función serverless.
		adapter: adapter({ edge: false })
	}
};

export default config;
