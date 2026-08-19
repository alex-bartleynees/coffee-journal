import { Schema } from 'effect';

/**
 * Wire contracts for the sync protocol — must mirror `src/schema.ts` in the
 * coffee-journal-api repo (same effect version, same shapes). See the
 * Sync-Protocol design doc: per-record last-write-wins on `updatedAt`,
 * server-assigned `cursor` (server_seq) as the pull position.
 */

export const Entity = Schema.Literal('bean', 'grinder', 'brew', 'machine', 'method', 'recipe');
export type Entity = typeof Entity.Type;

export const SyncRecord = Schema.Struct({
	entity: Entity,
	id: Schema.String,
	/** Client wall-clock epoch-ms of the last edit; the LWW key. */
	updatedAt: Schema.Number,
	deleted: Schema.Boolean,
	/** Full record body (domain object); opaque to the server. */
	payload: Schema.NullOr(Schema.Unknown)
});
export type SyncRecord = typeof SyncRecord.Type;

export const SyncRequest = Schema.Struct({
	since: Schema.Number,
	changes: Schema.Array(SyncRecord)
});
export type SyncRequest = typeof SyncRequest.Type;

export const SyncResponse = Schema.Struct({
	/** Ids the server accepted from our push — clear their dirty flag. */
	applied: Schema.Array(Schema.String),
	/** Records where the server had a newer version — adopt these locally. */
	rejected: Schema.Array(SyncRecord),
	/** Server records with server_seq > since. */
	changes: Schema.Array(SyncRecord),
	/** New high-water server_seq; store as the next `since`. */
	cursor: Schema.Number
});
export type SyncResponse = typeof SyncResponse.Type;
