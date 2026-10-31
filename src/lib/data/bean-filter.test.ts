import { describe, expect, it } from 'vitest';
import { beanStatus, storedBeanFilter } from './bean-filter';

describe('storedBeanFilter', () => {
	it.each(['all', 'active', 'upcoming', 'finished'] as const)('restores %s', (filter) => {
		expect(storedBeanFilter(filter)).toBe(filter);
	});

	it.each([null, '', 'archived'])('falls back to all for %s', (filter) => {
		expect(storedBeanFilter(filter)).toBe('all');
	});
});

describe('beanStatus', () => {
 it('keeps existing bags active and separates unopened and finished bags', () => {
  expect(beanStatus({})).toBe('active');
  expect(beanStatus({ upcoming: true })).toBe('upcoming');
  expect(beanStatus({ finished: true })).toBe('finished');
  expect(beanStatus({ upcoming: true, finished: true })).toBe('finished');
 });
});
