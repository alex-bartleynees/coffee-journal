import { describe, expect, it } from 'vitest';
import { storedBeanFilter } from './bean-filter';

describe('storedBeanFilter', () => {
	it.each(['all', 'active', 'finished'] as const)('restores %s', (filter) => {
		expect(storedBeanFilter(filter)).toBe(filter);
	});

	it.each([null, '', 'archived'])('falls back to all for %s', (filter) => {
		expect(storedBeanFilter(filter)).toBe('all');
	});
});
