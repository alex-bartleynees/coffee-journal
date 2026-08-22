// Cookie-session auth through coffee-journal-bff. `init()` checks
// `/bff/user`; sign-in is a full-page redirect into the Keycloak OIDC flow;
// sign-out is a form POST to `/bff/logout` (form navigation so the OIDC
// end-session redirect chain actually runs — a fetch would swallow it).

import { getCsrfToken } from '$lib/bff';
import { registerCurrentUser } from '$lib/users';

let signedIn = $state(false);
let email = $state<string | null>(null);
let checked = $state(false);

type BffUser = { isAuthenticated: boolean; claims: { type: string; value: string }[] };

async function registerSignedInUser(): Promise<void> {
	try {
		if (!(await registerCurrentUser(await getCsrfToken()))) {
			console.warn('[auth] Bloom user registration failed; will retry on next app load');
		}
	} catch (e) {
		console.warn('[auth] Bloom user registration failed; will retry on next app load', e);
	}
}

/** Resolve the current BFF session. Never throws. */
async function init(): Promise<void> {
	try {
		const res = await fetch('/bff/user', { credentials: 'include' });
		if (res.ok) {
			const user = (await res.json()) as BffUser;
			signedIn = user.isAuthenticated === true;
			email = user.claims.find((c) => c.type === 'email')?.value ?? null;
			if (signedIn) {
				void registerSignedInUser();
			}
		}
	} catch (e) {
		console.warn('[auth] session check failed:', e);
	} finally {
		checked = true;
	}
}

function signIn(): void {
	window.location.href = '/bff/login';
}

async function signOut(): Promise<void> {
	try {
		const token = await getCsrfToken();
		// Full-page form POST: antiforgery accepts the default form field, and
		// the browser follows the OIDC end-session redirects properly.
		const form = document.createElement('form');
		form.method = 'POST';
		form.action = '/bff/logout';
		const input = document.createElement('input');
		input.type = 'hidden';
		input.name = '__RequestVerificationToken';
		input.value = token;
		form.appendChild(input);
		document.body.appendChild(form);
		form.submit();
	} catch (e) {
		console.warn('[auth] logout failed:', e);
	}
}

export const auth = {
	get signedIn() {
		return signedIn;
	},
	get email() {
		return email;
	},
	/** True once the initial session check has completed (immediately in dev mode). */
	get checked() {
		return checked;
	},
	init,
	signIn,
	signOut
};
