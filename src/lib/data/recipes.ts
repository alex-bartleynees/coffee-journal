import type { Recipe, RecipeStep } from './types';

export function compatibleRecipes(recipes: Recipe[], methodId: string, beanId: string): Recipe[] {
	return recipes
		.filter((recipe) => recipe.methodId === methodId && (!recipe.beanId || recipe.beanId === beanId))
		.sort((a, b) => {
			const beanOrder = Number(Boolean(b.beanId)) - Number(Boolean(a.beanId));
			return beanOrder || a.name.localeCompare(b.name);
		});
}

export function validateRecipeSteps(steps: RecipeStep[], targetTime: number): string | null {
	if (steps.length === 0) return 'Add at least one guided step.';
	for (let index = 0; index < steps.length; index += 1) {
		const step = steps[index];
		if (!step?.label.trim()) return 'Every step needs a label.';
		if (!Number.isFinite(step.time) || step.time < 0) return 'Step times must be zero or greater.';
		if (step.time > targetTime) return 'Step times cannot be later than the target time.';
		if (index > 0 && step.time <= steps[index - 1]!.time) return 'Step times must increase.';
		if (step.water != null) {
			if (!Number.isFinite(step.water) || step.water < 0) return 'Water targets must be zero or greater.';
			const previousWater = steps.slice(0, index).findLast((candidate) => candidate.water != null)?.water;
			if (previousWater != null && step.water < previousWater) return 'Water targets must not decrease.';
		}
	}
	return null;
}

export function guidedMilestones(recipe: Pick<Recipe, 'steps' | 'targetTime'>): RecipeStep[] {
	const steps = [...recipe.steps].sort((a, b) => a.time - b.time);
	if (steps.at(-1)?.time === recipe.targetTime) return steps;
	return [...steps, { id: `finish-${recipe.targetTime}`, label: 'Finish', time: recipe.targetTime }];
}

export function recipeRatio(recipe: Pick<Recipe, 'doseIn' | 'yieldOut'>): string {
	return recipe.doseIn > 0 && recipe.yieldOut > 0
		? `1:${(recipe.yieldOut / recipe.doseIn).toFixed(1)}`
		: '—';
}
