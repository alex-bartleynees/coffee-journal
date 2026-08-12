import { describe, expect, it } from 'vitest';
import { equipmentRoot, storedEquipmentRoot } from './equipment-nav';

describe('equipment navigation', () => {
	it('maps equipment detail and creation routes to their tab root', () => {
		expect(equipmentRoot('/machines/m1')).toBe('/machines');
		expect(equipmentRoot('/methods/new')).toBe('/methods');
	});

	it('rejects unrelated or malformed stored destinations', () => {
		expect(storedEquipmentRoot('/account')).toBe('/grinders');
		expect(storedEquipmentRoot('/machines/m1')).toBe('/grinders');
		expect(storedEquipmentRoot('/methods')).toBe('/methods');
	});
});

