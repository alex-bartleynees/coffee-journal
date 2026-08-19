import { describe, expect, it } from 'vitest';
import type { Recipe } from './types';
import { compatibleRecipes, recipeRatio, validateRecipeSteps } from './recipes';

const recipe = (overrides: Partial<Recipe>): Recipe => ({
	id: 'r1', methodId: 'espresso', name: 'Standard', doseIn: 18, yieldOut: 36,
	temperature: 93, targetTime: 30, steps: [{ id: 's1', label: 'Start', time: 30 }],
	...overrides
});

describe('recipes', () => {
	it('returns matching bean recipes before any-bean recipes', () => {
		const recipes = [
			recipe({ id: 'any', name: 'Any bean' }),
			recipe({ id: 'other', name: 'Other', beanId: 'b2' }),
			recipe({ id: 'match', name: 'Match', beanId: 'b1' }),
			recipe({ id: 'v60', name: 'V60', methodId: 'v60' })
		];
		expect(compatibleRecipes(recipes, 'espresso', 'b1').map(({ id }) => id)).toEqual(['match', 'any']);
	});

	it('validates cumulative time and water milestones', () => {
		expect(validateRecipeSteps([
			{ id: 'a', label: 'Bloom', time: 0, water: 40 },
			{ id: 'b', label: 'Finish', time: 30, water: 36 }
		], 30)).toBe('Water targets must not decrease.');
		expect(validateRecipeSteps([
			{ id: 'a', label: 'Start', time: 0 },
			{ id: 'b', label: 'Finish', time: 29 }
		], 30)).toBe('The final step time must match the target time.');
	});

	it('formats the ratio from targets', () => {
		expect(recipeRatio(recipe({}))).toBe('1:2.0');
	});
});
