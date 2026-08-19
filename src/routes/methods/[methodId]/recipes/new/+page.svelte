<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import BackHeader from '$lib/components/BackHeader.svelte';
	import Icon from '$lib/icons/Icon.svelte';
	import { journal } from '$lib/stores/journal.svelte';
	import { newId } from '$lib/data/id';
	import { recipeRatio, validateRecipeSteps } from '$lib/data/recipes';
	import type { Recipe, RecipeStep } from '$lib/data/types';

	const method = $derived(journal.methods.find((candidate) => candidate.id === page.params.methodId));
	const editId = $derived(page.url.searchParams.get('edit'));
	const existingRecipe = $derived(editId ? journal.recipes.find((recipe) => recipe.id === editId) : undefined);
	let initializedEditId: string | null = null;

	let name = $state('');
	let beanId = $state('');
	let doseIn = $state(18);
	let yieldOut = $state(36);
	let temperature = $state(93);
	let grind = $state('');
	let targetTime = $state(30);
	let notes = $state('');
	let steps = $state<RecipeStep[]>([
		{ id: newId('step'), label: 'Start', time: 0 },
		{ id: newId('step'), label: 'Finish', time: 30 }
	]);

	const stepError = $derived(validateRecipeSteps(steps, targetTime));
	const canSave = $derived(
		Boolean(method) && name.trim().length > 0 && doseIn > 0 && yieldOut > 0 &&
		temperature >= 85 && temperature <= 100 && targetTime > 0 && !stepError
	);
	const ratio = $derived(recipeRatio({ doseIn, yieldOut }));

	$effect(() => {
		if (!editId || !existingRecipe || initializedEditId === editId) return;
		name = existingRecipe.name;
		beanId = existingRecipe.beanId ?? '';
		doseIn = existingRecipe.doseIn;
		yieldOut = existingRecipe.yieldOut;
		temperature = existingRecipe.temperature;
		grind = existingRecipe.grind ?? '';
		targetTime = existingRecipe.targetTime;
		notes = existingRecipe.notes ?? '';
		steps = existingRecipe.steps.map((step) => ({ ...step }));
		initializedEditId = editId;
	});

	function close() {
		goto(method ? `/methods/${method.id}` : '/methods', { replaceState: true });
	}

	function addStep() {
		const previous = steps.at(-1);
		steps = [...steps, {
			id: newId('step'), label: '', time: previous ? previous.time + 10 : 0,
			water: previous?.water
		}];
	}

	function updateStep(id: string, field: 'label' | 'time' | 'water', value: string) {
		steps = steps.map((step) => {
			if (step.id !== id) return step;
			if (field === 'label') return { ...step, label: value };
			if (field === 'water' && value === '') {
				const { water: _, ...withoutWater } = step;
				return withoutWater;
			}
			return { ...step, [field]: Number(value) };
		});
	}

	function removeStep(id: string) {
		steps = steps.filter((step) => step.id !== id);
	}

	function save() {
		if (!canSave || !method) return;
		const recipe: Recipe = {
			id: existingRecipe?.id ?? newId('recipe'), methodId: method.id, name: name.trim(),
			beanId: beanId || undefined, doseIn, yieldOut, temperature,
			grind: grind.trim() || undefined, targetTime, notes: notes.trim() || undefined,
			steps: steps.map((step) => ({ ...step, label: step.label.trim() }))
		};
		if (existingRecipe) journal.updateRecipe(recipe);
		else journal.addRecipe(recipe);
		goto(`/methods/${method.id}`, { replaceState: true });
	}
</script>

{#if journal.ready && (!method || (editId && !existingRecipe))}
	<div class="screen">
		<BackHeader onBack={() => goto('/methods')} label={editId ? 'Edit recipe' : 'New recipe'} />
		<div class="not-found"><h1>{method ? 'Recipe not found' : 'Method not found'}</h1></div>
	</div>
{:else}
	<div class="screen recipe-screen">
		<BackHeader onBack={close} label={editId ? 'Edit recipe' : 'New recipe'} />
		<div class="form">
			<div class="field">
				<div class="field-label">Name</div>
				<input class="field-input" placeholder="Standard shot" bind:value={name} />
			</div>

			<div class="field">
				<div class="field-label">Bean pairing (optional)</div>
				<div class="chip-group">
					<button type="button" class="chip" class:active={beanId === ''} onclick={() => (beanId = '')}>Any bean</button>
					{#each journal.beans.filter((bean) => !bean.finished || bean.id === beanId) as bean (bean.id)}
						<button type="button" class="chip" class:active={beanId === bean.id} onclick={() => (beanId = bean.id)}>{bean.name}</button>
					{/each}
				</div>
			</div>

			<div class="field-row">
				<label class="field"><span class="field-label">Dose in (g)</span><input class="field-input" type="number" min="0.1" step="0.1" bind:value={doseIn} /></label>
				<label class="field"><span class="field-label">{method?.id === 'espresso' ? 'Yield' : 'Water'} (g)</span><input class="field-input" type="number" min="0.1" step="0.1" bind:value={yieldOut} /></label>
			</div>
			<div class="field-row">
				<label class="field"><span class="field-label">Water temp (°C)</span><input class="field-input" type="number" min="85" max="100" step="0.5" bind:value={temperature} /></label>
				<div class="ratio-card"><span class="field-label">Ratio</span><strong class="mono">{ratio}</strong></div>
			</div>
			<label class="field"><span class="field-label">Grind guidance (optional)</span><input class="field-input" placeholder="Medium-fine" bind:value={grind} /></label>
			<label class="field"><span class="field-label">Target time (seconds)</span><input class="field-input" type="number" min="1" step="1" bind:value={targetTime} /></label>

			<div class="field">
				<div class="field-label">Guided steps</div>
				<div class="step-head"><span>Label</span><span>Time</span><span>Water</span><span></span></div>
				<div class="steps">
					{#each steps as step (step.id)}
						<div class="step-row">
							<input class="field-input" aria-label="Step label" value={step.label} oninput={(event) => updateStep(step.id, 'label', event.currentTarget.value)} />
							<input class="field-input" aria-label="Step time in seconds" type="number" min="0" step="1" value={step.time} oninput={(event) => updateStep(step.id, 'time', event.currentTarget.value)} />
							<input class="field-input" aria-label="Cumulative water in grams" type="number" min="0" step="1" value={step.water ?? ''} placeholder="g" oninput={(event) => updateStep(step.id, 'water', event.currentTarget.value)} />
							<button class="remove-step" type="button" aria-label={`Remove ${step.label || 'step'}`} onclick={() => removeStep(step.id)}><Icon name="close" size={16} /></button>
						</div>
					{/each}
				</div>
				<button class="add-step" type="button" onclick={addStep}><Icon name="plus" size={14} /> Add step</button>
				{#if stepError}<p class="form-error" role="alert">{stepError}</p>{/if}
			</div>

			<label class="field"><span class="field-label">Notes (optional)</span><textarea class="field-input" rows="4" placeholder="Tips, adjustments…" bind:value={notes}></textarea></label>
		</div>

		<div class="form-footer">
			<button class="btn btn-ghost" type="button" onclick={close}>Cancel</button>
			<button class="btn btn-accent" type="button" disabled={!canSave} onclick={save}><Icon name="check" size={16} /> {editId ? 'Save changes' : 'Save recipe'}</button>
		</div>
	</div>
{/if}

<style>
	.form { padding: 16px; display: flex; flex-direction: column; gap: 16px; }
	.field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
	.ratio-card { display: flex; flex-direction: column; justify-content: center; gap: 8px; padding: 10px 14px; border: 1px solid var(--line-soft); border-radius: var(--r-md); background: var(--card); }
	.ratio-card strong { font-size: 17px; }
	.step-head, .step-row { display: grid; grid-template-columns: minmax(0, 1fr) 72px 72px 32px; gap: 7px; align-items: center; }
	.step-head { padding: 0 4px 5px; color: var(--ink-3); font-size: 9px; letter-spacing: .7px; text-transform: uppercase; }
	.steps { display: flex; flex-direction: column; gap: 8px; }
	.step-row .field-input { min-width: 0; padding: 11px 9px; }
	.remove-step { width: 32px; height: 40px; display: grid; place-items: center; color: var(--ink-3); }
	.add-step { margin-top: 10px; width: 100%; padding: 12px; border: 1px dashed var(--line); border-radius: var(--r-md); color: var(--ink-3); display: flex; justify-content: center; gap: 6px; }
	.form-error { margin: 8px 0 0; color: var(--danger, #a33a2b); font-size: 12px; }
	.form-footer { padding: 14px 16px calc(14px + env(safe-area-inset-bottom, 16px)); border-top: 1px solid var(--line-soft); background: var(--paper); display: flex; gap: 10px; }
	.form-footer .btn:last-child { flex: 1; }
	.btn[disabled] { opacity: .5; }
	.not-found { padding: 48px 20px; text-align: center; }
	.not-found h1 { font-family: var(--serif); font-style: italic; font-weight: 500; }
	@media (min-width: 860px) {
		.recipe-screen { max-width: 720px; }
		.form { padding: 24px 28px; }
		.form-footer { padding-left: 28px; padding-right: 28px; }
	}
</style>
