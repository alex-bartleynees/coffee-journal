import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

// Note: the local SQLite store persists to OPFS via the SAHPool VFS, which runs
// entirely in the DB worker with no SharedArrayBuffer — so it does NOT require
// cross-origin isolation. We used to set COOP/COEP here (and in nginx) for that
// reason; verified 2026-08-05 that OPFS persistence works without them, so they
// were removed. Keeping COEP off also spares the planned PWA service worker from
// the cross-origin font-caching problems COEP causes. If a future feature needs
// crossOriginIsolated (SharedArrayBuffer / threaded wasm), reinstate them.

export default defineConfig({
	optimizeDeps: {
		exclude: ['@sqlite.org/sqlite-wasm']
	},
	plugins: [
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
