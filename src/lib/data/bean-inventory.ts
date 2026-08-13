const DISPLAY_DECIMAL_PLACES = 2;
const DISPLAY_SCALE = 10 ** DISPLAY_DECIMAL_PLACES;

export interface BeanInventory {
	remainingGrams: number;
	percentUsed: number;
	finished: boolean;
}

export function beanInventory(bagWeight: number, doses: readonly number[]): BeanInventory {
	const consumedGrams = doses.reduce((total, dose) => total + dose, 0);
	const rawRemaining = Math.max(0, bagWeight - consumedGrams);
	const remainingGrams = Math.round(rawRemaining * DISPLAY_SCALE) / DISPLAY_SCALE;
	const finished = remainingGrams === 0;
	const percentUsed = bagWeight > 0 ? Math.min(100, (consumedGrams / bagWeight) * 100) : 100;

	return { remainingGrams, percentUsed, finished };
}
