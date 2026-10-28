<script lang="ts">
	import Icon from '$lib/icons/Icon.svelte';
	import { newId } from '$lib/data/id';
	import { MINERAL_ADDITION_PRESETS, MINERAL_STAGES } from '$lib/data/water';
	import type { MineralAddition } from '$lib/data/types';

	let { additions = $bindable() }: { additions: MineralAddition[] } = $props();

	function add(template: Omit<MineralAddition, 'id'>) {
		additions.push({ id: newId('min'), ...template });
	}

	function remove(id: string) {
		additions = additions.filter((addition) => addition.id !== id);
	}
</script>

<div class="field">
	<div class="field-label">Mineral additions (optional — amounts are set on each brew)</div>

	{#each additions as addition (addition.id)}
		<div class="option-card">
			<div class="option-head">
				<input class="field-input" placeholder="Apax Lab" aria-label="Product" bind:value={addition.product} />
				<input class="field-input unit" placeholder="Unit" aria-label="Unit" bind:value={addition.unit} />
				<button type="button" class="icon-btn" aria-label="Remove addition" onclick={() => remove(addition.id)}>
					<Icon name="close" size={14} />
				</button>
			</div>
			<div class="chip-group" role="group" aria-label="When it's added">
				{#each MINERAL_STAGES as stage (stage.value)}
					<button
						type="button"
						class="chip"
						class:active={addition.stage === stage.value}
						onclick={() => (addition.stage = stage.value)}
					>
						{stage.label}
					</button>
				{/each}
			</div>
			<div class="option-numbers">
				<label><span>Min</span><input class="field-input" type="number" inputmode="decimal" bind:value={addition.min} /></label>
				<label><span>Max</span><input class="field-input" type="number" inputmode="decimal" bind:value={addition.max} /></label>
				<label><span>Step</span><input class="field-input" type="number" inputmode="decimal" min="0" bind:value={addition.step} /></label>
				<label><span>Default</span><input class="field-input" type="number" inputmode="decimal" bind:value={addition.default} /></label>
			</div>
		</div>
	{/each}

	<div class="chip-group">
		{#each MINERAL_ADDITION_PRESETS as preset (preset.label)}
			<button type="button" class="chip" onclick={() => add(preset.addition)}>+ {preset.label}</button>
		{/each}
		<button
			type="button"
			class="chip"
			onclick={() => add({ product: '', stage: 'brew-water', min: 0, max: 10, step: 1, default: 0 })}
		>
			+ Custom
		</button>
	</div>
</div>

<style>
	.option-card {
		padding: 10px;
		border: 1px solid var(--line-soft);
		border-radius: var(--r-md);
		background: var(--card);
		display: flex;
		flex-direction: column;
		gap: 8px;
		margin-bottom: 8px;
	}
	.option-head {
		display: flex;
		gap: 6px;
		align-items: center;
	}
	.option-head .field-input {
		flex: 1;
		min-width: 0;
	}
	.option-head .unit {
		flex: 0 0 72px;
	}
	.option-numbers {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 6px;
	}
	.option-numbers label {
		display: flex;
		flex-direction: column;
		gap: 3px;
		min-width: 0;
	}
	.option-numbers span {
		font-size: 9px;
		letter-spacing: 1px;
		text-transform: uppercase;
		color: var(--ink-3);
	}
	.option-numbers .field-input {
		width: 100%;
		min-width: 0;
	}
</style>
