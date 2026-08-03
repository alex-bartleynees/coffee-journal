/**
 * Generate a globally-unique record id.
 *
 * IDs must be collision-safe across devices: the sync engine resolves conflicts
 * by last-write-wins keyed on the record id, so two devices generating the same
 * id for different records would silently merge them. `crypto.randomUUID()`
 * gives us that guarantee; the short prefix is purely for human readability in
 * logs / the DB (`b_…` bean, `g_…` grinder, `br_…` brew).
 */
export function newId(prefix: string): string {
	return `${prefix}_${crypto.randomUUID()}`;
}
