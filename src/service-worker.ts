/// <reference types="@sveltejs/kit" />
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />

// Bloom's service worker: caches the app shell so the PWA launches instantly and
// works offline. The DB itself is already offline (local SQLite in OPFS), so this
// only handles the static shell — auth/sync/billing always go to the network.
// SvelteKit auto-registers this module; see [[PWA-Service-Worker]] in the wiki.

import { build, files, version } from '$service-worker';

const sw = self as unknown as ServiceWorkerGlobalScope;

const CACHE = `bloom-${version}`;

// App shell: content-hashed build assets (JS/CSS) and static files (icons,
// manifest, favicons). Two things are cached outside this list:
//   - the SPA fallback document (index.html) — cached under '/' in `install`,
//     since adapter-static's fallback isn't in build/files;
//   - the SQLite WASM (emitted under _app/immutable/workers/assets/, which
//     SvelteKit leaves out of `build`) — runtime-cached by the fetch handler on
//     the first online load, since the DB worker's fetch is SW-intercepted.
// Net: full offline works from the first successful online load onward.
const PRECACHE = [...build, ...files];

sw.addEventListener('install', (event) => {
	event.waitUntil(
		(async () => {
			const cache = await caches.open(CACHE);
			await cache.addAll(PRECACHE);
			// Cache the SPA shell under '/' so navigations resolve offline.
			try {
				const res = await fetch('/', { cache: 'no-store' });
				if (res.ok) await cache.put('/', res.clone());
			} catch {
				// Offline at install time — the shell is captured on first online load.
			}
			await sw.skipWaiting();
		})()
	);
});

sw.addEventListener('activate', (event) => {
	event.waitUntil(
		(async () => {
			// Drop caches from previous versions.
			for (const key of await caches.keys()) {
				if (key !== CACHE) await caches.delete(key);
			}
			await sw.clients.claim();
		})()
	);
});

// Paths that must always hit the network and never be cached: the sync endpoint,
// the BFF session/login/logout + CSRF endpoints, billing, and the raw API. This
// also keeps the SW out of the full-page /bff/login OIDC redirect chain, and out
// of the sync engine's own offline queue (the `dirty` flag).
const NETWORK_ONLY = /^\/(api|bff|sync|billing)(\/|$)/;

sw.addEventListener('fetch', (event) => {
	const { request } = event;
	if (request.method !== 'GET') return;

	const url = new URL(request.url);
	if (url.origin !== sw.location.origin) return; // let the browser handle cross-origin (e.g. Google Fonts)
	if (NETWORK_ONLY.test(url.pathname)) return;

	event.respondWith(respond(request, url));
});

async function respond(request: Request, url: URL): Promise<Response> {
	const cache = await caches.open(CACHE);

	// Precached shell assets are content-hashed / static — cache-first.
	if (PRECACHE.includes(url.pathname)) {
		const cached = await cache.match(url.pathname);
		if (cached) return cached;
	}

	// Navigations: network-first so a fresh shell wins online; fall back to the
	// cached SPA shell offline (the client router then renders the route).
	if (request.mode === 'navigate') {
		try {
			return await fetch(request);
		} catch {
			const shell = (await cache.match('/')) ?? (await cache.match('/index.html'));
			if (shell) return shell;
			throw new Error('offline: no cached app shell');
		}
	}

	// Any other same-origin GET: network-first, runtime-cache the result, fall
	// back to cache when offline.
	try {
		const res = await fetch(request);
		if (res.ok && res.type === 'basic') void cache.put(request, res.clone());
		return res;
	} catch {
		const cached = await cache.match(request);
		if (cached) return cached;
		throw new Error(`offline: ${url.pathname} not cached`);
	}
}
