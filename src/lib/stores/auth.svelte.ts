// Dual-mode auth store (Phase 2 Step 3).
//
// BFF mode (VITE_BFF=true — the containerised deployment behind
// coffee-journal-bff): cookie session against the BFF. `init()` checks
// `/bff/user`; sign-in is a full-page redirect into the Keycloak OIDC flow;
// sign-out is a form POST to `/bff/logout` (form navigation so the OIDC
// end-session redirect chain actually runs — a fetch would swallow it).
//
// Dev mode (plain `npm run dev`): the original Phase-1 local stand-in — a flag
// flip so the UI can show "synced" state, no real identity. Sign-in never
// blocks app usage in either mode.

import { BFF_MODE, getCsrfToken } from '$lib/bff';

let signedIn = $state(false);
let email = $state<string | null>(null);
let checked = $state(false);

type BffUser = { isAuthenticated: boolean; claims: { type: string; value: string }[] };

/** Resolve the current session. No-op in dev mode. Never throws. */
async function init(): Promise<void> {
	if (!BFF_MODE) {
		checked = true;
		return;
	}
	try {
		const res = await fetch('/bff/user', { credentials: 'include' });
		if (res.ok) {
			const user = (await res.json()) as BffUser;
			signedIn = user.isAuthenticated === true;
			email = user.claims.find((c) => c.type === 'email')?.value ?? null;
		}
	} catch (e) {
		console.warn('[auth] session check failed:', e);
	} finally {
		checked = true;
	}
}

function signIn(): void {
	if (BFF_MODE) {
		window.location.href = '/bff/login';
		return;
	}
	signedIn = true;
}

async function signOut(): Promise<void> {
	if (BFF_MODE) {
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
		return;
	}
	email = null;
	signedIn = false;
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
