import { describe, expect, it } from 'vitest';
import { methodLabel } from './methods';

describe('methodLabel', () => {
	it('uses the current persisted label', () => {
		expect(methodLabel([{ id: 'espresso', label: 'Short black', icon: 'espresso' }], 'espresso'))
			.toBe('Short black');
	});

	it('falls back to the id while method data is unavailable', () => {
		expect(methodLabel([], 'moka-pot')).toBe('moka-pot');
	});
});

