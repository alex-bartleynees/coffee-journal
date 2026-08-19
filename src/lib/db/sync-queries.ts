import { exec, query } from './index';
import {
	beanFromRow,
	brewFromRow,
	grinderFromRow,
	machineFromRow,
	methodFromRow,
	recipeFromRow,
	insertBean,
	insertBrew,
	insertGrinder,
	insertMachine,
	insertMethod,
	insertRecipe,
	type BeanRow,
	type BrewRow,
	type GrinderRow,
	type MachineRow,
	type MethodRow,
	type RecipeRow,
	type PresetRow
} from './queries';
import { SYNCABLE_TABLES } from './schema';
import type { Bean, Brew, Grinder, Machine, MethodDef, Recipe } from '$lib/data/types';
import type { Entity, SyncRecord } from '$lib/sync/protocol';

/**
 * DB operations used only by the sync engine. Everything here follows the
 * Sync-Protocol design: the dirty flag is the outbound queue, `updated_at`
 * is the LWW key, and the pull cursor lives in `_meta`.
 */

const TABLE: Record<Entity, string> = {
	bean: 'beans', grinder: 'grinders', brew: 'brews', machine: 'machines', method: 'methods', recipe: 'recipes'
};

type MetaRow = { value: string };
type SyncFlagsRow = { updated_at: number; deleted: number; dirty: number };

/** All locally-changed records (upserts and tombstones), as wire records. */
export async function getDirtyRecords(): Promise<SyncRecord[]> {
	const records: SyncRecord[] = [];

	const beans = await query<BeanRow & SyncFlagsRow>('SELECT * FROM beans WHERE dirty = 1');
	for (const r of beans) {
		records.push({
			entity: 'bean', id: r.id, updatedAt: r.updated_at,
			deleted: !!r.deleted, payload: beanFromRow(r)
		});
	}

	const grinders = await query<GrinderRow & SyncFlagsRow>('SELECT * FROM grinders WHERE dirty = 1');
	const presets = await query<PresetRow>('SELECT grinder_id, method, setting FROM grinder_presets ORDER BY grinder_id, id');
	for (const r of grinders) {
		records.push({
			entity: 'grinder', id: r.id, updatedAt: r.updated_at,
			deleted: !!r.deleted,
			payload: grinderFromRow(r, presets.filter((p) => p.grinder_id === r.id))
		});
	}

	const brews = await query<BrewRow & SyncFlagsRow>('SELECT * FROM brews WHERE dirty = 1');
	for (const r of brews) {
		records.push({
			entity: 'brew', id: r.id, updatedAt: r.updated_at,
			deleted: !!r.deleted, payload: brewFromRow(r)
		});
	}

	const machines = await query<MachineRow & SyncFlagsRow>('SELECT * FROM machines WHERE dirty = 1');
	for (const r of machines) {
		records.push({
			entity: 'machine', id: r.id, updatedAt: r.updated_at,
			deleted: !!r.deleted, payload: machineFromRow(r)
		});
	}

	const methods = await query<MethodRow & SyncFlagsRow>('SELECT * FROM methods WHERE dirty = 1');
	for (const r of methods) {
		records.push({
			entity: 'method', id: r.id, updatedAt: r.updated_at,
			deleted: !!r.deleted, payload: methodFromRow(r)
		});
	}

	const recipes = await query<RecipeRow & SyncFlagsRow>('SELECT * FROM recipes WHERE dirty = 1');
	for (const r of recipes) {
		records.push({
			entity: 'recipe', id: r.id, updatedAt: r.updated_at,
			deleted: !!r.deleted, payload: recipeFromRow(r)
		});
	}

	return records;
}

/**
 * Clear the dirty flag after the server acknowledged a pushed record — but only
 * if the row hasn't been edited again while the request was in flight (guarded
 * by comparing `updated_at` to the value we pushed).
 */
export async function clearDirty(entity: Entity, id: string, pushedUpdatedAt: number): Promise<void> {
	await exec(
		`UPDATE ${TABLE[entity]} SET dirty = 0 WHERE id = ? AND updated_at = ?`,
		[id, pushedUpdatedAt]
	);
}

/**
 * Apply a server record locally under last-write-wins. Skipped when the local
 * row is same-or-newer (`updated_at >= remote`) — that covers both our own
 * just-pushed records echoed back in the pull, and a local edit made while the
 * sync request was in flight (still dirty, will win next cycle).
 */
export async function applyRemoteRecord(rec: SyncRecord): Promise<boolean> {
	const rows = await query<SyncFlagsRow>(
		`SELECT updated_at, deleted, dirty FROM ${TABLE[rec.entity]} WHERE id = ?`,
		[rec.id]
	);
	const local = rows[0];
	if (local && local.updated_at >= rec.updatedAt) return false;

	const meta = { updatedAt: rec.updatedAt, dirty: 0 as const, deleted: rec.deleted ? (1 as const) : (0 as const) };

	if (rec.payload == null) {
		// Pure tombstone with no body: nothing to create if we never had the row.
		if (!local) return false;
		await exec(
			`UPDATE ${TABLE[rec.entity]} SET deleted = ?, dirty = 0, updated_at = ? WHERE id = ?`,
			[meta.deleted, rec.updatedAt, rec.id]
		);
		return true;
	}

	if (rec.entity === 'bean') await insertBean(rec.payload as Bean, meta);
	else if (rec.entity === 'grinder') await insertGrinder(rec.payload as Grinder, meta);
	else if (rec.entity === 'machine') await insertMachine(rec.payload as Machine, meta);
	else if (rec.entity === 'method') await insertMethod(rec.payload as MethodDef, meta);
	else if (rec.entity === 'recipe') await insertRecipe(rec.payload as Recipe, meta);
	else await insertBrew(rec.payload as Brew, meta);
	return true;
}

/** Pull cursor (highest server_seq seen), persisted in `_meta`. */
export async function getSyncCursor(): Promise<number> {
	const rows = await query<MetaRow>("SELECT value FROM _meta WHERE key = 'sync_cursor'");
	return rows.length ? Number(rows[0].value) : 0;
}

export async function setSyncCursor(cursor: number): Promise<void> {
	await exec(
		`INSERT INTO _meta (key, value) VALUES ('sync_cursor', ?)
		ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
		[String(cursor)]
	);
}

/** Whether this device has been through first-sign-in enrollment. */
export async function isEnrolled(): Promise<boolean> {
	const rows = await query<MetaRow>("SELECT value FROM _meta WHERE key = 'sync_enrolled'");
	return rows.length > 0;
}

/**
 * First-sign-in union merge: mark every local record dirty so the next sync
 * pushes it all; the server unions by id with LWW on collisions. Rows that
 * predate the sync schema (updated_at = 0, e.g. the dev seed) get a real
 * timestamp so they can participate in LWW.
 */
export async function enrollForSync(): Promise<void> {
	const now = Date.now();
	for (const table of SYNCABLE_TABLES) {
		await exec(
			`UPDATE ${table} SET dirty = 1,
				updated_at = CASE WHEN updated_at = 0 THEN ? ELSE updated_at END`,
			[now]
		);
	}
	await exec(
		`INSERT INTO _meta (key, value) VALUES ('sync_enrolled', '1')
		ON CONFLICT(key) DO NOTHING`
	);
}
