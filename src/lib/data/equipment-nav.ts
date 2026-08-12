export type EquipmentRoot = '/grinders' | '/machines' | '/methods';

export const DEFAULT_EQUIPMENT_ROOT: EquipmentRoot = '/grinders';

export function equipmentRoot(pathname: string): EquipmentRoot | undefined {
	if (pathname === '/grinders' || pathname.startsWith('/grinders/')) return '/grinders';
	if (pathname === '/machines' || pathname.startsWith('/machines/')) return '/machines';
	if (pathname === '/methods' || pathname.startsWith('/methods/')) return '/methods';
	return undefined;
}

export function storedEquipmentRoot(value: string | null): EquipmentRoot {
	return value && equipmentRoot(value) === value ? value as EquipmentRoot : DEFAULT_EQUIPMENT_ROOT;
}

