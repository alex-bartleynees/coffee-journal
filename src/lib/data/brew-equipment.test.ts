import { describe, expect, it } from 'vitest';
import { brewEquipment, brewSelection } from './brew-equipment';

const equipment = [
	{ id: 'active', retired: false },
	{ id: 'legacy', retired: true },
	{ id: 'unmarked' }
];

describe('brew equipment', () => {
	it('excludes retired equipment from a new brew', () => {
		expect(brewEquipment(equipment).map((item) => item.id)).toEqual(['active', 'unmarked']);
	});

	it('keeps a retired selection available while editing a historical brew', () => {
		expect(brewEquipment(equipment, 'legacy').map((item) => item.id)).toEqual([
			'active',
			'legacy',
			'unmarked'
		]);
	});
});

describe('brew selection', () => {
	it('replaces a retired selection on a new brew with the first active item', () => {
		expect(brewSelection(equipment, 'legacy')).toBe('active');
	});

	it('replaces an unknown selection on a new brew', () => {
		expect(brewSelection(equipment, 'g1')).toBe('active');
	});

	it("keeps the edited brew's own equipment, even when retired or deleted", () => {
		expect(brewSelection(equipment, 'legacy', 'legacy')).toBe('legacy');
		expect(brewSelection(equipment, 'deleted', 'deleted')).toBe('deleted');
	});

	it('leaves the selection alone when nothing is offered', () => {
		expect(brewSelection([{ id: 'legacy', retired: true }], 'legacy')).toBe('legacy');
	});
});
