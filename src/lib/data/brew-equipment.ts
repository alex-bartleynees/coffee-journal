/**
 * Equipment offered while logging a brew. Retired equipment is hidden for new
 * brews, but the equipment already attached to an edited brew remains available.
 */
export function brewEquipment<T extends { id: string; retired?: boolean }>(
	equipment: T[],
	includeId?: string
): T[] {
	return equipment.filter((item) => !item.retired || item.id === includeId);
}

/**
 * The equipment id a draft brew should hold. Keeps the current choice while it
 * is still offered (or is the edited brew's own equipment, even if since
 * deleted); otherwise falls back to the first offered item. With nothing
 * offered, the current choice is left alone.
 */
export function brewSelection<T extends { id: string; retired?: boolean }>(
	equipment: T[],
	selectedId: string,
	includeId?: string
): string {
	if (selectedId === includeId) return selectedId;
	const available = brewEquipment(equipment, includeId);
	if (available.some((item) => item.id === selectedId)) return selectedId;
	return available[0]?.id ?? selectedId;
}
