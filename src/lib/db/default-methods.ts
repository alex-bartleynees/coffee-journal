import type { MethodDef } from '$lib/data/types';

export const DEFAULT_METHODS_MARKER = 'default_methods_v1';

type DefaultMethodDatabase = {
	markerExists(key: string): Promise<boolean>;
	insertIfMissing(method: MethodDef): Promise<void>;
	setMarker(key: string): Promise<void>;
};

export async function ensureDefaultMethods(
	database: DefaultMethodDatabase,
	defaults: MethodDef[]
): Promise<void> {
	if (await database.markerExists(DEFAULT_METHODS_MARKER)) return;

	for (const method of defaults) await database.insertIfMissing(method);
	await database.setMarker(DEFAULT_METHODS_MARKER);
}

