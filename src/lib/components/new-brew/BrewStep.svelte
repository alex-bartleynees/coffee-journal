<script lang="ts">
	import Timer from './Timer.svelte';
	import GuidedBrew from './GuidedBrew.svelte';
	import Icon from '$lib/icons/Icon.svelte';
	import Stepper from './Stepper.svelte';
	import type { Grinder, Machine, Recipe, WaterProfile } from '$lib/data/types';
	import type { DraftBrew } from './DraftBrew';
	import { brewEquipment } from '$lib/data/brew-equipment';
	import { optionValue, stepDecimals } from '$lib/data/machine-options';
	import { stageLabel } from '$lib/data/water';

	interface Props {
		draft: DraftBrew;
		grinders: Grinder[];
		recipe?: Recipe;
		machine?: Machine;
		waterProfiles: WaterProfile[];
		waterProfile?: WaterProfile;
		includeGrinderId?: string;
		includeWaterId?: string;
	}

	let { draft, grinders, recipe, machine, waterProfiles, waterProfile, includeGrinderId, includeWaterId }: Props = $props();
	const machineOptions = $derived(machine?.brewOptions ?? []);
	let guiding = $state(false);

	const availableGrinders = $derived(brewEquipment(grinders, includeGrinderId));
	const availableWater = $derived(brewEquipment(waterProfiles, includeWaterId));
	const ratio = $derived(draft.yieldOut && draft.doseIn ? `1:${(draft.yieldOut / draft.doseIn).toFixed(1)}` : '—');
	const grinder = $derived(availableGrinders.find((g) => g.id === draft.grinder) ?? availableGrinders[0]);
</script>

<div class="step">
	<div class="col-left">
		{#if recipe}
			<div class="recipe-banner">
				<div><span>Recipe</span><strong>{recipe.name}</strong></div>
				<button type="button" onclick={() => (guiding = true)}><Icon name="play" size={13} /> Guided brew</button>
			</div>
		{/if}
		<Timer seconds={draft.extractionTime} method={draft.method} onChange={(v) => (draft.extractionTime = v)} />
	</div>

	<div class="col-right">
		<div class="section-label">Recipe</div>
		<div class="recipe-fields">
			<div class="field-row">
				<Stepper label="Dose in" value={draft.doseIn} unit="g" step={0.1} decimals={1} min={5} max={30} onChange={(v) => (draft.doseIn = v)} />
				<Stepper
					label="Yield out"
					value={draft.yieldOut}
					unit="g"
					step={draft.method === 'espresso' ? 1 : 5}
					min={draft.method === 'espresso' ? 10 : 100}
					max={500}
					onChange={(v) => (draft.yieldOut = v)}
				/>
			</div>
			<div class="field-row">
				<Stepper label="Temp" value={draft.temperature} unit="°C" step={0.5} decimals={1} min={85} max={100} onChange={(v) => (draft.temperature = v)} />
				<div class="ratio-display">
					<div class="field-label">Ratio</div>
					<div class="ratio-value mono">{ratio}</div>
				</div>
			</div>
			<div class="field">
				<div class="field-label">Notes</div>
				<textarea
					class="field-input recipe-notes"
					rows="2"
					placeholder="Bloom 40g / 30s, slow pour…"
					bind:value={draft.recipeNotes}
				></textarea>
			</div>
		</div>

		{#if machine && machineOptions.length > 0}
			<div class="section-label">{machine.name}</div>
			<div class="machine-options">
				{#each machineOptions as option (option.id)}
					<Stepper
						label={option.label}
						value={optionValue(option, draft.machineSettings)}
						unit={option.unit}
						step={option.step}
						decimals={stepDecimals(option.step)}
						min={option.min}
						max={option.max}
						onChange={(v) => (draft.machineSettings[option.id] = v)}
					/>
				{/each}
			</div>
		{/if}

		<div class="section-label">Grinder</div>
		<div class="grinder-chips">
			{#each availableGrinders as g (g.id)}
				<button class="chip" class:active={draft.grinder === g.id} onclick={() => (draft.grinder = g.id)}>
					{g.name}
				</button>
			{/each}
		</div>

		{#if grinder}
			<Stepper
				label={`Grind setting · ${grinder.range[0]}–${grinder.range[1]}`}
				value={draft.grindSetting}
				unit="clicks"
				step={grinder.step}
				decimals={grinder.step < 1 ? 1 : 0}
				min={grinder.range[0]}
				max={grinder.range[1]}
				onChange={(v) => (draft.grindSetting = v)}
			/>
		{/if}

		{#if availableWater.length > 0}
			<div class="section-label water-label">Water</div>
			<div class="chip-group water-chips">
				<button class="chip" class:active={!draft.waterProfile} onclick={() => (draft.waterProfile = null)}>None</button>
				{#each availableWater as w (w.id)}
					<button class="chip" class:active={draft.waterProfile === w.id} onclick={() => (draft.waterProfile = w.id)}>
						{w.name}
					</button>
				{/each}
			</div>
			{#if waterProfile?.additions.length}
				<div class="machine-options">
					{#each waterProfile.additions as addition (addition.id)}
						<Stepper
							label={`${addition.product} · ${stageLabel(addition.stage)}`}
							value={optionValue(addition, draft.mineralDoses)}
							unit={addition.unit}
							step={addition.step}
							decimals={stepDecimals(addition.step)}
							min={addition.min}
							max={addition.max}
							onChange={(v) => (draft.mineralDoses[addition.id] = v)}
						/>
					{/each}
				</div>
			{/if}
		{/if}
	</div>
</div>

{#if guiding && recipe}
	<GuidedBrew {recipe} seconds={draft.extractionTime} onChange={(value) => (draft.extractionTime = value)} onClose={() => (guiding = false)} />
{/if}

<style>
	.step {
		padding: 8px 16px;
	}
	.col-left,
	.col-right {
		display: contents;
	}
	.recipe-fields {
		display: flex;
		flex-direction: column;
		gap: 12px;
		margin-bottom: 12px;
	}
	.recipe-banner { margin-bottom: 12px; padding: 13px 14px; border: 1px solid var(--line); border-radius: var(--r-md); background: var(--card); display: flex; align-items: center; gap: 12px; }
	.recipe-banner > div { flex: 1; min-width: 0; display: flex; flex-direction: column; }
	.recipe-banner span { color: var(--ink-3); font-size: 9px; letter-spacing: 1px; text-transform: uppercase; }
	.recipe-banner strong { font-family: var(--serif); font-size: 16px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
	.recipe-banner button { padding: 10px 13px; border-radius: 100px; background: var(--ink); color: var(--paper); display: flex; align-items: center; gap: 7px; font-size: 12px; font-weight: 600; }
	.recipe-notes {
		resize: none;
		font-size: 14px;
	}
	.ratio-display {
		display: flex;
		flex-direction: column;
		gap: 4px;
		padding: 10px 14px;
		background: var(--card);
		border: 1px solid var(--line-soft);
		border-radius: 12px;
		justify-content: center;
	}
	.ratio-value {
		font-size: 16px;
		font-weight: 600;
		color: var(--ink);
	}
	.machine-options {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 12px;
		margin-bottom: 12px;
	}
	.water-label {
		margin-top: 16px;
	}
	.water-chips {
		margin-bottom: 12px;
	}
	.grinder-chips {
		display: flex;
		gap: 6px;
		margin-bottom: 12px;
	}
	.grinder-chips .chip {
		flex: 1;
		padding: 10px 8px;
		justify-content: center;
		font-size: 12px;
	}

	@media (min-width: 860px) {
		.step {
			padding: 0;
			display: grid;
			grid-template-columns: 340px 1fr;
			gap: 32px;
		}
		.col-left,
		.col-right {
			display: block;
		}
	}
</style>
