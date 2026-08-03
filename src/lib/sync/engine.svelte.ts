import { Duration, Effect, Schedule, Schema } from 'effect';
import { BFF_MODE, getCsrfToken, invalidateCsrfToken } from '$lib/bff';
import { auth } from '$lib/stores/auth.svelte';
import {
	applyRemoteRecord,
	clearDirty,
	enrollForSync,
	getDirtyRecords,
	getSyncCursor,
	isEnrolled,
	setSyncCursor
} from '$lib/db/sync-queries';
import { SyncResponse, type SyncRecord } from './protocol';

/**
 * The client sync engine (Sync-Protocol design): one serialised delta cycle —
 * dirty-scan → POST /sync → clear acked dirty flags / adopt server versions /
 * apply pulled changes → store cursor. Sync is strictly additive: it never
 * blocks the UI, and every failure ends up as a banner-friendly status string,
 * never a thrown error.
 *
 * Triggers: layout start (if signed in), debounced after each local mutation,
 * window `online`, and a periodic backstop interval.
 */

/**
 * BFF mode: same-origin `/api/sync` — cookies carry the session, YARP attaches
 * the Bearer token, and the antiforgery middleware wants `X-CSRF-TOKEN`.
 * Dev mode: straight at the local API with its `x-dev-user` dev auth.
 */
const SYNC_ENDPOINT = BFF_MODE
	? '/api/sync'
	: `${(import.meta.env.VITE_SYNC_URL as string | undefined) ?? 'http://localhost:3001'}/sync`;
const DEBOUNCE_MS = 2_000;
const INTERVAL_MS = 120_000;

let status = $state<'idle' | 'syncing' | 'error'>('idle');
let lastSyncAt = $state<number | null>(null);
let errorMessage = $state<string | null>(null);

/** Re-loads the journal store after remote changes land; wired up in start(). */
let refresh: () => Promise<void> = async () => {};

class SyncHttpError extends Error {
	constructor(
		readonly status_: number,
		message: string
	) {
		super(message);
	}
}

/**
 * Request headers per mode. BFF: the antiforgery token (session/identity ride
 * on the cookie + YARP's Bearer attach — the browser never holds the JWT).
 * Dev: the API's dev-mode `x-dev-user` header.
 */
async function authHeaders(): Promise<Record<string, string>> {
	if (BFF_MODE) return { 'X-CSRF-TOKEN': await getCsrfToken() };
	if (import.meta.env.DEV) return { 'x-dev-user': 'dev' };
	return {};
}

const postSync = (body: string) =>
	Effect.tryPromise({
		try: async () =>
			fetch(SYNC_ENDPOINT, {
				method: 'POST',
				headers: { 'content-type': 'application/json', ...(await authHeaders()) },
				body,
				...(BFF_MODE ? { credentials: 'include' as const } : {})
			}),
		catch: (e) => new Error(`network: ${String(e)}`)
	}).pipe(
		Effect.flatMap((res) => {
			// A 400 in BFF mode is most likely a stale antiforgery token — drop the
			// cache so the next cycle fetches a fresh one.
			if (BFF_MODE && res.status === 400) invalidateCsrfToken();
			return res.ok
				? Effect.promise(() => res.json())
				: Effect.fail(new SyncHttpError(res.status, `sync failed: HTTP ${res.status}`));
		}),
		Effect.flatMap(Schema.decodeUnknown(SyncResponse)),
		// Transient network errors retry with backoff; HTTP/decode errors don't
		// (a 401 or bad contract won't fix itself seconds later).
		Effect.retry({
			schedule: Schedule.exponential(Duration.seconds(1)).pipe(
				Schedule.compose(Schedule.recurs(3))
			),
			while: (e) => !(e instanceof SyncHttpError) && !(e as { _tag?: string })._tag
		})
	);

const syncCycle = Effect.gen(function* () {
	const changes = yield* Effect.promise(getDirtyRecords);
	const since = yield* Effect.promise(getSyncCursor);
	const response = yield* postSync(JSON.stringify({ since, changes }));

	// Clear dirty on acked pushes (guarded by the pushed updated_at, so an edit
	// made while the request was in flight stays dirty for the next cycle).
	const pushedById = new Map(changes.map((c) => [c.id, c]));
	for (const id of response.applied) {
		const pushed = pushedById.get(id);
		if (pushed) yield* Effect.promise(() => clearDirty(pushed.entity, id, pushed.updatedAt));
	}

	// Adopt the server's newer version of anything we pushed stale, then apply
	// the pulled delta (both LWW-guarded locally in applyRemoteRecord).
	let appliedLocally = 0;
	for (const rec of [...response.rejected, ...response.changes] as SyncRecord[]) {
		const applied = yield* Effect.promise(() => applyRemoteRecord(rec));
		if (applied) appliedLocally += 1;
	}

	yield* Effect.promise(() => setSyncCursor(response.cursor));
	return { appliedLocally };
});

let started = false;
let running = false;
let runAgain = false;
let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let intervalTimer: ReturnType<typeof setInterval> | null = null;

async function runSync(): Promise<void> {
	// `started` gates on the DB being initialised — start() runs after journal.init().
	if (!started || !auth.signedIn || !navigator.onLine) return;
	if (running) {
		runAgain = true;
		return;
	}
	running = true;
	status = 'syncing';
	try {
		const { appliedLocally } = await Effect.runPromise(syncCycle);
		if (appliedLocally > 0) await refresh();
		status = 'idle';
		errorMessage = null;
		lastSyncAt = Date.now();
	} catch (e) {
		status = 'error';
		errorMessage = e instanceof Error ? e.message : String(e);
		console.warn('[sync] cycle failed:', e);
	} finally {
		running = false;
		if (runAgain) {
			runAgain = false;
			void runSync();
		}
	}
}

/** Debounced trigger — called by the journal store after every local mutation. */
function schedule(): void {
	if (!auth.signedIn) return;
	if (debounceTimer) clearTimeout(debounceTimer);
	debounceTimer = setTimeout(() => void runSync(), DEBOUNCE_MS);
}

/**
 * First-sign-in union merge (Sync-Protocol Decision 2): mark everything dirty
 * once, then run a normal cycle — local data uploads, cloud data downloads,
 * collisions resolve by LWW. Safe to call on every sign-in; enrollment is a
 * one-time `_meta` sentinel.
 */
async function onSignIn(): Promise<void> {
	if (!started || !auth.signedIn) return;
	try {
		if (!(await isEnrolled())) await enrollForSync();
	} catch (e) {
		console.warn('[sync] enrollment failed:', e);
		return;
	}
	void runSync();
}

/** Called once from the layout after journal.init(); wires refresh + triggers. */
function start(options: { refresh: () => Promise<void> }): void {
	refresh = options.refresh;
	started = true;
	window.addEventListener('online', () => void runSync());
	if (!intervalTimer) intervalTimer = setInterval(() => void runSync(), INTERVAL_MS);
	if (auth.signedIn) void onSignIn();
}

export const sync = {
	get status() { return status; },
	get lastSyncAt() { return lastSyncAt; },
	get error() { return errorMessage; },
	start,
	schedule,
	onSignIn
};
