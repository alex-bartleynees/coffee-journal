// SPA mode: no SSR anywhere. All data lives client-side (SQLite/OPFS in a Web
// Worker), so server rendering has nothing to render and the static adapter's
// index.html fallback serves every route.
export const ssr = false;
export const prerender = false;
