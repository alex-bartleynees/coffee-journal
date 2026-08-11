/**
 * Local schema version. Bumped whenever the shape changes; `migrate()` in the
 * worker brings pre-existing OPFS databases up to this version. v1 added the
 * sync-metadata columns (`updated_at` / `deleted` / `dirty`) to the three
 * syncable tables; v2 added brew recipe notes — see [[Sync-Protocol]].
 */
export const SCHEMA_VERSION = 4;

/**
 * Sync-metadata columns present on every syncable table (beans/grinders/brews):
 * - `updated_at` — epoch-ms of the last local edit; the last-write-wins key.
 * - `deleted`    — tombstone flag so deletions propagate before compaction.
 * - `dirty`      — local change not yet acknowledged by the server (the implicit
 *                  outbound sync queue).
 */
export const SYNC_COLUMNS: readonly [string, string][] = [
	['updated_at', 'INTEGER NOT NULL DEFAULT 0'],
	['deleted', 'INTEGER NOT NULL DEFAULT 0'],
	['dirty', 'INTEGER NOT NULL DEFAULT 0']
];

/** Tables that participate in sync (grinder_presets travel inside their grinder). */
export const SYNCABLE_TABLES = ['beans', 'grinders', 'brews'] as const;

/** Brew columns added after the initial schema, used to upgrade existing DBs. */
export const BREW_MIGRATION_COLUMNS: readonly [string, string][] = [
	['recipe_notes', 'TEXT']
];

export const PHOTO_SYNC_COLUMNS: readonly [string, string][] = [
	['deleted', 'INTEGER NOT NULL DEFAULT 0'],
	['dirty', 'INTEGER NOT NULL DEFAULT 1']
];

export const SCHEMA_SQL = `
	CREATE TABLE IF NOT EXISTS beans (
		id           TEXT PRIMARY KEY,
		name         TEXT NOT NULL,
		roaster      TEXT NOT NULL,
		origin       TEXT NOT NULL,
		process      TEXT NOT NULL,
		varietal     TEXT NOT NULL,
		roast        TEXT NOT NULL,
		altitude     TEXT NOT NULL,
		tasting      TEXT NOT NULL DEFAULT '[]',
		date_opened  TEXT NOT NULL,
		roast_date   TEXT NOT NULL,
		price_per_kg REAL NOT NULL DEFAULT 0,
		bag_weight   REAL NOT NULL DEFAULT 0,
		finished     INTEGER NOT NULL DEFAULT 0,
		updated_at   INTEGER NOT NULL DEFAULT 0,
		deleted      INTEGER NOT NULL DEFAULT 0,
		dirty        INTEGER NOT NULL DEFAULT 0
	);

	-- Binary stays local for offline display; metadata/dirty state drives the
	-- separate subscriber photo-sync channel.
	CREATE TABLE IF NOT EXISTS bean_photos (
		bean_id    TEXT PRIMARY KEY,
		mime_type  TEXT NOT NULL,
		image_data BLOB,
		updated_at INTEGER NOT NULL,
		deleted    INTEGER NOT NULL DEFAULT 0,
		dirty      INTEGER NOT NULL DEFAULT 0
	);

	CREATE TABLE IF NOT EXISTS grinders (
		id        TEXT PRIMARY KEY,
		name      TEXT NOT NULL,
		maker     TEXT NOT NULL,
		range_min REAL NOT NULL,
		range_max REAL NOT NULL,
		step      REAL NOT NULL,
		type      TEXT NOT NULL,
		burr      TEXT NOT NULL,
		rpm       REAL,
		notes     TEXT,
		updated_at INTEGER NOT NULL DEFAULT 0,
		deleted    INTEGER NOT NULL DEFAULT 0,
		dirty      INTEGER NOT NULL DEFAULT 0
	);

	CREATE TABLE IF NOT EXISTS grinder_presets (
		id         INTEGER PRIMARY KEY AUTOINCREMENT,
		grinder_id TEXT NOT NULL,
		method     TEXT NOT NULL,
		setting    REAL NOT NULL
	);

	CREATE TABLE IF NOT EXISTS brews (
		id              TEXT PRIMARY KEY,
		bean_id         TEXT NOT NULL,
		method          TEXT NOT NULL,
		date            TEXT NOT NULL,
		time            TEXT NOT NULL,
		grinder         TEXT NOT NULL,
		grind_setting   REAL NOT NULL,
		dose_in         REAL NOT NULL,
		yield_out       REAL NOT NULL,
		extraction_time REAL NOT NULL,
		temperature     REAL NOT NULL,
		ratio           TEXT NOT NULL,
		rating          REAL NOT NULL,
		rating2         REAL,
		aroma           TEXT,
		flavor          TEXT,
		body            TEXT,
		finish          TEXT,
		descriptors     TEXT DEFAULT '[]',
		with_milk       INTEGER,
		cuts_thru_milk  INTEGER,
		buy_again       TEXT,
		best_for        TEXT,
		recipe_notes    TEXT,
		favorite        INTEGER NOT NULL DEFAULT 0,
		updated_at      INTEGER NOT NULL DEFAULT 0,
		deleted         INTEGER NOT NULL DEFAULT 0,
		dirty           INTEGER NOT NULL DEFAULT 0
	);

	CREATE TABLE IF NOT EXISTS _meta (
		key   TEXT PRIMARY KEY,
		value TEXT NOT NULL
	);
`;
