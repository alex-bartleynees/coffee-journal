import { describe, expect, it } from 'vitest';
import { beanInventory } from './bean-inventory';

describe('beanInventory', () => {
	it('clamps an over-consumed bag at zero and marks it finished', () => {
		const inventory = beanInventory(250, [18.3, 18.3, 18.3, 18.3, 18.3, 18.3, 18.3, 18.3, 18.3, 18.3, 18.3, 18.3, 18.3, 27]);

		expect(inventory.remainingGrams).toBe(0);
		expect(inventory.percentUsed).toBe(100);
		expect(inventory.finished).toBe(true);
	});

	it('rounds the displayed balance to at most two decimal places', () => {
		const inventory = beanInventory(250, [18.333]);

		expect(inventory.remainingGrams).toBe(231.67);
		expect(inventory.finished).toBe(false);
	});
});
