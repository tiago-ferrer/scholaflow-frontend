import adapter from '@sveltejs/adapter-static';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: adapter({
			fallback: 'index.html' // SPA mode: nginx serves index.html for all routes
		}),
		prerender: {
			handleUnseenRoutes: 'ignore' // dynamic [id] routes handled client-side via fallback
		}
	}
};

export default config;
