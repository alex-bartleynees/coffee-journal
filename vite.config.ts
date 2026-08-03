import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig, type Plugin } from 'vite';

// @sqlite.org/sqlite-wasm uses OPFS for persistence, which only works when the
// page is cross-origin isolated (crossOriginIsolated === true). That requires
// these two headers on the document. Vite's `server.headers` option is not
// reliably applied to SvelteKit's SSR responses in dev, so we set them via a
// middleware that runs before SvelteKit handles the request.
// In production these must be set by the web server (nginx/ArgoCD).
function setIsolationHeaders(res: { setHeader(name: string, value: string): void }): void {
	res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
	res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
}

const crossOriginIsolation: Plugin = {
	name: 'cross-origin-isolation',
	configureServer(server) {
		server.middlewares.use((_req, res, next) => {
			setIsolationHeaders(res);
			next();
		});
	},
	configurePreviewServer(server) {
		server.middlewares.use((_req, res, next) => {
			setIsolationHeaders(res);
			next();
		});
	}
};

export default defineConfig({
	optimizeDeps: {
		exclude: ['@sqlite.org/sqlite-wasm']
	},
	plugins: [
		crossOriginIsolation,
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},

			// Static SPA build: the app is fully client-side (local-first SQLite in
			// the browser, no server data), so every route falls back to index.html
			// and nginx serves the result in the container/k8s deployment.
			adapter: adapter({ fallback: 'index.html' })
		})
	]
});
