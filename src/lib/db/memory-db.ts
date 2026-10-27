import sqlite3InitModule from '@sqlite.org/sqlite-wasm';
import { SCHEMA_SQL } from './schema';
import type { SqlValue } from './sqlite.worker';

/**
 * Test stand-in for `./index`: the same exec/query API over an in-memory SQLite
 * with the real schema, so tests run the actual SQL the app ships. Use with
 * `vi.mock('./index', () => import('./memory-db'))` and `resetMemoryDb()`.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let sqlite3: any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let db: any;

export async function resetMemoryDb(): Promise<void> {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	sqlite3 ??= await (sqlite3InitModule as any)();
	db?.close();
	db = new sqlite3.oo1.DB(':memory:', 'ct');
	db.exec({ sql: SCHEMA_SQL });
}

export async function exec(sql: string, bind?: SqlValue[]): Promise<void> {
	db.exec({ sql, bind });
}

export async function query<T extends Record<string, unknown>>(sql: string, bind?: SqlValue[]): Promise<T[]> {
	const rows: T[] = [];
	db.exec({ sql, bind, rowMode: 'object', resultRows: rows });
	return rows;
}
