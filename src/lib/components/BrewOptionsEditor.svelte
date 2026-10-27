<script lang="ts">
	import Icon from '$lib/icons/Icon.svelte';
	import { newId } from '$lib/data/id';
	import { BREW_OPTION_PRESETS } from '$lib/data/machine-options';
	import type { MachineBrewOption } from '$lib/data/types';

	let { options = $bindable() }: { options: MachineBrewOption[] } = $props();

	function add(template: Omit<MachineBrewOption, 'id'>) {
		options.push({ id: newId('opt'), ...template });
	}

	function remove(id: string) {
		options = options.filter((option) => option.id !== id);
	}
</script>

<div class="field">
	<div class="field-label">Brew options (optional — shown on the Brew step for this machine)</div>

	{#each options as option (option.id)}
		<div class="option-card">
			<div class="option-head">
				<input class="field-input" placeholder="Pre-infusion time" aria-label="Option name" bind:value={option.label} />
				<input class="field-input unit" placeholder="Unit" aria-label="Unit" bind:value={option.unit} />
				<button type="button" class="icon-btn" aria-label="Remove option" onclick={() => remove(option.id)}>
					<Icon name="close" size={14} />
				</button>
			</div>
			<div class="option-numbers">
				<label><span>Min</span><input class="field-input" type="number" inputmode="decimal" bind:value={option.min} /></label>
				<label><span>Max</span><input class="field-input" type="number" inputmode="decimal" bind:value={option.max} /></label>
				<label><span>Step</span><input class="field-input" type="number" inputmode="decimal" min="0" bind:value={option.step} /></label>
				<label><span>Default</span><input class="field-input" type="number" inputmode="decimal" bind:value={option.default} /></label>
			</div>
		</div>
	{/each}

	<div class="chip-group">
		{#each BREW_OPTION_PRESETS as preset (preset.label)}
			<button type="button" class="chip" onclick={() => add(preset)}>+ {preset.label}</button>
		{/each}
		<button type="button" class="chip" onclick={() => add({ label: '', min: 0, max: 10, step: 1, default: 0 })}>
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
