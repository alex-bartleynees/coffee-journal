import { describe, expect, it } from 'vitest';
import { espressoDrinkForBrew, espressoDrinkLabel, isMilkEspressoDrink } from './espresso-drinks';
import type { Brew } from './types';

const brew = (values: Partial<Brew>): Brew => ({ method: 'espresso', ...values } as Brew);

describe('espresso drink normalization', () => {
	it('keeps a canonical black drink', () => expect(espressoDrinkForBrew(brew({ espressoDrink: 'Long Black' }))).toBe('Long Black'));
	it('derives a known legacy milk drink', () => expect(espressoDrinkForBrew(brew({ withMilk: true, milkDrink: 'Cortado' }))).toBe('Cortado'));
	it('uses the established flat-white fallback for old milk records', () => expect(espressoDrinkForBrew(brew({ withMilk: true }))).toBe('Flat White'));
	it('does not invent a type for old black records', () => expect(espressoDrinkLabel(brew({ withMilk: false }))).toBe('Unspecified espresso drink'));
	it('ignores the field for other methods', () => expect(espressoDrinkForBrew(brew({ method: 'v60', espressoDrink: 'Americano' }))).toBeNull());
	it('classifies milk drinks', () => {
		expect(isMilkEspressoDrink('Flat White')).toBe(true);
		expect(isMilkEspressoDrink('Long Black')).toBe(false);
	});
});
