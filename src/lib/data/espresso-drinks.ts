import { BLACK_ESPRESSO_DRINKS, MILK_DRINKS, type Brew, type EspressoDrink } from './types';

const blackDrinks = new Set<string>(BLACK_ESPRESSO_DRINKS);
const milkDrinks = new Set<string>(MILK_DRINKS);

export function isEspressoDrink(value: unknown): value is EspressoDrink {
	return typeof value === 'string' && (blackDrinks.has(value) || milkDrinks.has(value));
}

export function isMilkEspressoDrink(value: EspressoDrink | null | undefined): boolean {
	return value != null && milkDrinks.has(value);
}

/** Canonical read model, including the reliable legacy milk fallback. */
export function espressoDrinkForBrew(brew: Brew): EspressoDrink | null {
	if (brew.method !== 'espresso') return null;
	if (isEspressoDrink(brew.espressoDrink)) return brew.espressoDrink;
	if (brew.withMilk) return isEspressoDrink(brew.milkDrink) ? brew.milkDrink : 'Flat White';
	return null;
}

export function espressoDrinkLabel(brew: Brew): string | null {
	if (brew.method !== 'espresso') return null;
	return espressoDrinkForBrew(brew) ?? 'Unspecified espresso drink';
}
