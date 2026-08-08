/// <reference lib="webworker" />
import sqlite3InitModule from '@sqlite.org/sqlite-wasm';
import wasmUrl from '@sqlite.org/sqlite-wasm/sqlite3.wasm?url';
import {
	BREW_MIGRATION_COLUMNS,
	SCHEMA_SQL,
	SCHEMA_VERSION,
	SYNC_COLUMNS,
	SYNCABLE_TABLES
} from './schema';

export type ExecMsg = { id: number; type: 'exec'; sql: string; bind?: (string | number | null)[] };
export type QueryMsg = { id: number; type: 'query'; sql: string; bind?: (string | number | null)[] };
export type WorkerMsg = ExecMsg | QueryMsg;

export type WorkerReply =
	| { id: -1; type: 'ready'; hasOpfs: boolean; error?: string }
	| { id: number; result: Record<string, unknown>[] | null }
	| { id: number; error: string };

type Db = {
	exec(opts: {
		sql: string;
		bind?: (string | number | null)[];
		rowMode?: 'object';
		resultRows?: Record<string, unknown>[];
	}): void;
};

let db: Db | null = null;

/** Names of the columns currently on a table (via PRAGMA table_info). */
function columnNames(database: Db, table: string): Set<string> {
	const rows: Record<string, unknown>[] = [];
	database.exec({ sql: `PRAGMA table_info(${table})`, rowMode: 'object', resultRows: rows });
	return new Set(rows.map((r) => String(r.name)));
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
	database.exec({
		sql: `INSERT INTO _meta (key, value) VALUES ('schema_version', ?)
			ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
		bind: [String(SCHEMA_VERSION)]
	});
}

self.onmessage = ({ data }: MessageEvent<WorkerMsg>) => {
	if (!db) {
		(self as DedicatedWorkerGlobalScope).postMessage({
			id: data.id,
			error: 'DB not ready'
		} satisfies WorkerReply);
		return;
	}
	try {
		if (data.type === 'exec') {
			db.exec({ sql: data.sql, bind: data.bind });
			(self as DedicatedWorkerGlobalScope).postMessage({ id: data.id, result: null } satisfies WorkerReply);
		} else {
			const rows: Record<string, unknown>[] = [];
			db.exec({ sql: data.sql, bind: data.bind, rowMode: 'object', resultRows: rows });
			(self as DedicatedWorkerGlobalScope).postMessage({ id: data.id, result: rows } satisfies WorkerReply);
		}
	} catch (e) {
		(self as DedicatedWorkerGlobalScope).postMessage({ id: data.id, error: String(e) } satisfies WorkerReply);
	}
};

async function init() {
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

	(self as DedicatedWorkerGlobalScope).postMessage({
		id: -1,
		type: 'ready',
		hasOpfs
	} satisfies WorkerReply);
}

init().catch((e) => {
	(self as DedicatedWorkerGlobalScope).postMessage({
		id: -1,
		type: 'ready',
		hasOpfs: false,
		error: String(e)
	} satisfies WorkerReply);
});
