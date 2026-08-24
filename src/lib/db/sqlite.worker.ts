/// <reference lib="webworker" />
import sqlite3InitModule from '@sqlite.org/sqlite-wasm';
import wasmUrl from '@sqlite.org/sqlite-wasm/sqlite3.wasm?url';
import {
	BREW_MIGRATION_COLUMNS,
	METHOD_MIGRATION_COLUMNS,
	PHOTO_SYNC_COLUMNS,
	SCHEMA_SQL,
	SCHEMA_VERSION,
	SYNC_COLUMNS,
	SYNCABLE_TABLES
} from './schema';

export type SqlValue = string | number | null | Uint8Array;
export type ExecMsg = { id: number; type: 'exec'; sql: string; bind?: SqlValue[] };
export type QueryMsg = { id: number; type: 'query'; sql: string; bind?: SqlValue[] };
export type WorkerMsg = ExecMsg | QueryMsg;

export type WorkerReply =
	| { id: -1; type: 'ready'; hasOpfs: boolean; error?: string }
	| { id: number; result: Record<string, unknown>[] | null }
	| { id: number; error: string };

type Db = {
	exec(opts: {
		sql: string;
		bind?: SqlValue[];
		rowMode?: 'object';
		resultRows?: Record<string, unknown>[];
	}): void;
};

let db: Db | null = null;
let replyPort: MessagePort | null = null;

function reply(message: WorkerReply): void {
	replyPort?.postMessage(message);
}

/** Names of the columns currently on a table (via PRAGMA table_info). */
function columnNames(database: Db, table: string): Set<string> {
	const rows: Record<string, unknown>[] = [];
	database.exec({ sql: `PRAGMA table_info(${table})`, rowMode: 'object', resultRows: rows });
	return new Set(rows.map((r) => String(r.name)));
}

function columnIsNotNull(database: Db, table: string, column: string): boolean {
	const rows: Record<string, unknown>[] = [];
	database.exec({ sql: `PRAGMA table_info(${table})`, rowMode: 'object', resultRows: rows });
	return rows.some((row) => row.name === column && Number(row.notnull) === 1);
}

/** SQLite cannot remove a NOT NULL constraint in place, so v8 rebuilds brews. */
function makeBrewRatingNullable(database: Db): void {
	if (!columnIsNotNull(database, 'brews', 'rating')) return;
	database.exec({ sql: `
		BEGIN IMMEDIATE;
		CREATE TABLE brews_v8 (
			id TEXT PRIMARY KEY, bean_id TEXT NOT NULL, method TEXT NOT NULL,
			date TEXT NOT NULL, time TEXT NOT NULL, grinder TEXT NOT NULL, machine TEXT,
			grind_setting REAL NOT NULL, dose_in REAL NOT NULL, yield_out REAL NOT NULL,
			extraction_time REAL NOT NULL, temperature REAL NOT NULL, ratio TEXT NOT NULL,
			rating REAL, rating2 REAL, aroma TEXT, flavor TEXT, body TEXT, finish TEXT,
			descriptors TEXT DEFAULT '[]', with_milk INTEGER, milk_drink TEXT,
			cuts_thru_milk INTEGER, buy_again TEXT, best_for TEXT, recipe_notes TEXT, recipe_id TEXT,
			favorite INTEGER NOT NULL DEFAULT 0, updated_at INTEGER NOT NULL DEFAULT 0,
			deleted INTEGER NOT NULL DEFAULT 0, dirty INTEGER NOT NULL DEFAULT 0
		);
		INSERT INTO brews_v8 (
			id, bean_id, method, date, time, grinder, machine, grind_setting, dose_in,
			yield_out, extraction_time, temperature, ratio, rating, rating2, aroma,
			flavor, body, finish, descriptors, with_milk, milk_drink, cuts_thru_milk,
			buy_again, best_for, recipe_notes, recipe_id, favorite, updated_at, deleted, dirty
		)
		SELECT
			id, bean_id, method, date, time, grinder, machine, grind_setting, dose_in,
			yield_out, extraction_time, temperature, ratio, rating, rating2, aroma,
			flavor, body, finish, descriptors, with_milk, milk_drink, cuts_thru_milk,
			buy_again, best_for, recipe_notes, recipe_id, favorite, updated_at, deleted, dirty
		FROM brews;
		DROP TABLE brews;
		ALTER TABLE brews_v8 RENAME TO brews;
		COMMIT;
	` });
}

/**
 * Bring a pre-existing OPFS database up to SCHEMA_VERSION. Fresh databases get
 * the sync columns from SCHEMA_SQL directly, so this is a no-op for them;
 * existing ones (e.g. the dev seed DB) are missing the columns and get them via
 * idempotent ALTER TABLE ADD COLUMN (guarded by a table_info check, since SQLite
 * has no ADD COLUMN IF NOT EXISTS). See [[Sync-Protocol]].
 */
function migrate(database: Db): void {
	for (const table of SYNCABLE_TABLES) {
		const existing = columnNames(database, table);
		for (const [col, def] of SYNC_COLUMNS) {
			if (!existing.has(col)) {
				database.exec({ sql: `ALTER TABLE ${table} ADD COLUMN ${col} ${def}` });
			}
		}
	}
	const brewColumns = columnNames(database, 'brews');
	for (const [col, def] of BREW_MIGRATION_COLUMNS) {
		if (!brewColumns.has(col)) {
			database.exec({ sql: `ALTER TABLE brews ADD COLUMN ${col} ${def}` });
		}
	}
	makeBrewRatingNullable(database);
	const methodColumns = columnNames(database, 'methods');
	for (const [col, def] of METHOD_MIGRATION_COLUMNS) {
		if (!methodColumns.has(col)) {
			database.exec({ sql: `ALTER TABLE methods ADD COLUMN ${col} ${def}` });
		}
	}
	const photoColumns = columnNames(database, 'bean_photos');
	if (PHOTO_SYNC_COLUMNS.some(([col]) => !photoColumns.has(col))) {
		// Rebuild rather than ALTER: Phase 1 declared image_data NOT NULL, while
		// Phase 2 deletion tombstones deliberately store no binary payload.
		database.exec({ sql: `
			CREATE TABLE bean_photos_v4 (
				bean_id TEXT PRIMARY KEY, mime_type TEXT NOT NULL, image_data BLOB,
				updated_at INTEGER NOT NULL, deleted INTEGER NOT NULL DEFAULT 0,
				dirty INTEGER NOT NULL DEFAULT 0
			);
			INSERT INTO bean_photos_v4 (bean_id, mime_type, image_data, updated_at, deleted, dirty)
				SELECT bean_id, mime_type, image_data, updated_at, 0, 1 FROM bean_photos;
			DROP TABLE bean_photos;
			ALTER TABLE bean_photos_v4 RENAME TO bean_photos;
		` });
	}
	database.exec({
		sql: `INSERT INTO _meta (key, value) VALUES ('schema_version', ?)
			ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
		bind: [String(SCHEMA_VERSION)]
	});
}

self.onmessage = ({ data, ports }: MessageEvent<{ type: 'activate' }>) => {
	if (data.type !== 'activate' || !ports[0] || replyPort) return;
	replyPort = ports[0];
	replyPort.onmessage = handleMessage;
	replyPort.start();
	void holdWorkerLock();
	void init();
};

function handleMessage({ data }: MessageEvent<WorkerMsg>): void {
	if (!db) {
		reply({
			id: data.id,
			error: 'DB not ready'
		});
		return;
	}
	try {
		if (data.type === 'exec') {
			db.exec({ sql: data.sql, bind: data.bind });
			reply({ id: data.id, result: null });
		} else {
			const rows: Record<string, unknown>[] = [];
			db.exec({ sql: data.sql, bind: data.bind, rowMode: 'object', resultRows: rows });
			reply({ id: data.id, result: rows });
		}
	} catch (e) {
		reply({ id: data.id, error: String(e) });
	}
}

/** Holding a worker-owned Web Lock keeps browsers from suspending the active DB worker. */
async function holdWorkerLock(): Promise<void> {
	if (!('locks' in navigator)) return;
	await navigator.locks.request('bloom-sqlite-worker-active', () => new Promise(() => {}));
}

async function initialize(): Promise<void> {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const sqlite3 = await (sqlite3InitModule as any)({
		locateFile: (file: string) => (file.endsWith('.wasm') ? wasmUrl : file)
	});

	// Prefer the OPFS SAHPool VFS: it persists to OPFS entirely within this
	// worker, with no separate async-proxy worker to load and no cross-origin
	// isolation requirement — which makes it reliable under bundlers like Vite.
	// Falls back to a non-persistent in-memory DB if OPFS isn't available.
	let hasOpfs = false;
	try {
		const pool = await sqlite3.installOpfsSAHPoolVfs({ name: 'bloom' });
		db = new pool.OpfsSAHPoolDb('/bloom.db') as Db;
		hasOpfs = true;
	} catch (e) {
		console.warn('[sqlite] OPFS persistence unavailable, using in-memory DB:', e);
		db = new sqlite3.oo1.DB('/bloom.db', 'ct') as Db;
	}

	db.exec({ sql: SCHEMA_SQL });
	migrate(db);

	reply({
		id: -1,
		type: 'ready',
		hasOpfs
	});
}

function init(): Promise<void> {
	return initialize().catch((e) => {
		reply({
			id: -1,
			type: 'ready',
			hasOpfs: false,
			error: String(e)
		});
	});
}
