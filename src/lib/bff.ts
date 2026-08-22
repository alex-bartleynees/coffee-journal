/**
 * BFF plumbing. The app is always served behind `coffee-journal-bff`, so auth
 * is cookie-based:
 * `/bff/login` starts the Keycloak OIDC flow, `/bff/user` reports the session,
 * and every state-changing `/api/*` call must carry the `X-CSRF-TOKEN` header
 * (the BFF's antiforgery middleware rejects it otherwise).
 */

let csrfToken: string | null = null;

/** Antiforgery token for state-changing BFF calls; cached until invalidated. */
export async function getCsrfToken(): Promise<string> {
	if (csrfToken) return csrfToken;
	const res = await fetch('/bff/antiforgery', { credentials: 'include' });
	if (!res.ok) throw new Error(`antiforgery fetch failed: HTTP ${res.status}`);
	const data = (await res.json()) as { requestToken: string };
	csrfToken = data.requestToken;
	return csrfToken;
}

/** Drop the cached token (e.g. after a 400 antiforgery rejection). */
export function invalidateCsrfToken(): void {
	csrfToken = null;
}
