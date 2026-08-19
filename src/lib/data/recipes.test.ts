import { describe, expect, it } from 'vitest';
import type { Recipe } from './types';
import { compatibleRecipes, guidedMilestones, recipeRatio, validateRecipeSteps } from './recipes';

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
	});

	it('allows the last action before the total target time', () => {
		expect(validateRecipeSteps([
			{ id: 'b1', label: 'First bloom', time: 0 },
			{ id: 'b2', label: 'Second bloom', time: 30 },
			{ id: 'p1', label: 'First pour', time: 60 }
		], 150)).toBeNull();
	});

	it('rejects an action after the total target time', () => {
		expect(validateRecipeSteps([
			{ id: 'a', label: 'Start', time: 0 },
			{ id: 'b', label: 'Too late', time: 151 }
		], 150)).toBe('Step times cannot be later than the target time.');
	});

	it('adds target time as an implicit finish milestone', () => {
		const milestones = guidedMilestones(recipe({
			targetTime: 150,
			steps: [
				{ id: 'b1', label: 'First bloom', time: 0 },
				{ id: 'b2', label: 'Second bloom', time: 30 },
				{ id: 'p1', label: 'First pour', time: 60 }
			]
		}));
		expect(milestones.at(-1)).toEqual({ id: 'finish-150', label: 'Finish', time: 150 });
	});

	it('does not duplicate an explicit final step at target time', () => {
		const milestones = guidedMilestones(recipe({
			targetTime: 150,
			steps: [{ id: 'done', label: 'Drawdown complete', time: 150 }]
		}));
		expect(milestones).toHaveLength(1);
		expect(milestones[0]?.label).toBe('Drawdown complete');
	});

	it('formats the ratio from targets', () => {
		expect(recipeRatio(recipe({}))).toBe('1:2.0');
	});
});
