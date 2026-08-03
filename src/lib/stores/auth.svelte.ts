// Phase 1: local-only stand-in. Sign-in never blocks app usage — it just
// flips this flag so the UI can show "synced" state. Real auth + sync
// lands in Phase 2 (Effect.ts + backend).

let signedIn = $state(false);
let email = $state<string | null>(null);

function signIn() {
	signedIn = true;
}

function signOut() {
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
	signIn,
	signOut
};
