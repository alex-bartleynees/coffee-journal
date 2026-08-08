<script lang="ts">
	import { goto } from '$app/navigation';
	import BackHeader from '$lib/components/BackHeader.svelte';
	import Icon from '$lib/icons/Icon.svelte';
	import { journal } from '$lib/stores/journal.svelte';
	import { METHOD_LABELS } from '$lib/data/sample';
	import { newId } from '$lib/data/id';
	import type { Grinder, GrinderType, Method } from '$lib/data/types';

	let name = $state('');
	let maker = $state('');
	let type = $state<GrinderType>('espresso');
	let burr = $state('');
	let rpm = $state<number | null>(null);
	let rangeMin = $state(0);
	let rangeMax = $state(40);
	let step = $state(1);
	let notes = $state('');
	let presets = $state<{ method: Method; setting: number }[]>([]);

	const canSave = $derived(name.trim().length > 0 && maker.trim().length > 0);

	const types: { id: GrinderType; label: string }[] = [
		{ id: 'espresso', label: 'Espresso' },
		{ id: 'pourover', label: 'Pourover' }
	];
	const methods: Method[] = ['espresso', 'v60', 'aeropress'];

	function addPreset() {
		presets = [...presets, { method: 'espresso', setting: rangeMin }];
	}
	function removePreset(i: number) {
		presets = presets.filter((_, idx) => idx !== i);
	}

	function close() {
		history.length > 1 ? history.back() : goto('/grinders');
	}

	function save() {
		if (!canSave) return;
		const grinder: Grinder = {
			id: newId('g'),
			name: name.trim(),
			maker: maker.trim(),
			range: [rangeMin, rangeMax],
			step,
			type,
			burr: burr.trim() || '—',
			rpm,
			notes: notes.trim() || undefined,
			presets
		};
		journal.addGrinder(grinder);
		goto(`/grinders/${grinder.id}`, { replaceState: true });
	}
</script>

<div class="screen">
	<BackHeader onBack={close} label="New grinder" />

	<div class="form">
		<div class="field">
			<div class="field-label">Name</div>
			<input class="field-input" placeholder="Niche Zero" bind:value={name} />
		</div>
		<div class="field">
			<div class="field-label">Maker</div>
			<input class="field-input" placeholder="Niche" bind:value={maker} />
		</div>

		<div class="field">
			<div class="field-label">Type</div>
			<div class="segmented">
				{#each types as t (t.id)}
					<button class="seg-btn" class:selected={type === t.id} onclick={() => (type = t.id)}>
						{t.label}
					</button>
				{/each}
			</div>
		</div>

		<div class="field-row">
			<div class="field">
				<div class="field-label">Burr</div>
				<input class="field-input" placeholder="Conical 63mm" bind:value={burr} />
			</div>
			<div class="field">
				<div class="field-label">RPM (optional)</div>
				<input class="field-input" type="number" min="0" step="1" bind:value={rpm} />
			</div>
		</div>

		<div class="field-row">
			<div class="field">
				<div class="field-label">Range min</div>
				<input class="field-input" type="number" step="0.1" bind:value={rangeMin} />
			</div>
			<div class="field">
				<div class="field-label">Range max</div>
				<input class="field-input" type="number" step="0.1" bind:value={rangeMax} />
			</div>
		</div>
		<div class="field">
			<div class="field-label">Step</div>
			<input class="field-input" type="number" min="0.1" step="0.1" bind:value={step} />
		</div>

		<div class="field">
			<div class="field-label">Notes (optional)</div>
			<textarea class="field-input" rows="2" placeholder="Workhorse. Espresso 12–16…" bind:value={notes}
			></textarea>
		</div>

		<div class="section-label">Presets</div>
		<div class="presets">
			{#each presets as preset, i (i)}
				<div class="preset-row">
					<div class="segmented preset-methods">
						{#each methods as m (m)}
							<button
								class="seg-btn"
								class:selected={preset.method === m}
								onclick={() => (presets[i].method = m)}
							>
								{METHOD_LABELS[m]}
							</button>
						{/each}
					</div>
					<input class="field-input preset-setting" type="number" step={step} bind:value={presets[i].setting} />
					<button class="icon-btn" aria-label="Remove preset" onclick={() => removePreset(i)}>
						<Icon name="close" size={16} />
					</button>
				</div>
			{/each}
			<button class="add-preset" onclick={addPreset}>
				<Icon name="plus" size={14} strokeWidth={2} /> Add preset
			</button>
		</div>
	</div>

	<div class="form-footer">
		<button class="btn btn-accent" style="flex: 1" disabled={!canSave} onclick={save}>
			<Icon name="check" size={16} /> Save grinder
		</button>
	</div>
</div>

<style>
	.form {
		padding: 16px 16px 8px;
		display: flex;
		flex-direction: column;
		gap: 14px;
	}
	.segmented {
		display: flex;
		background: var(--card-2);
		border: 1px solid var(--line);
		border-radius: 12px;
		padding: 3px;
		gap: 3px;
	}
	.seg-btn {
		flex: 1;
		padding: 9px 0;
		border-radius: 9px;
		font-size: 13px;
		font-weight: 500;
		color: var(--ink-3);
		text-align: center;
		white-space: nowrap;
	}
	.seg-btn.selected {
		background: var(--ink);
		color: var(--paper);
	}
	.presets {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
	.preset-row {
		display: flex;
		align-items: center;
		gap: 8px;
	}
	.preset-methods {
		flex: 1;
		min-width: 0;
	}
	.preset-setting {
		width: 72px;
		flex-shrink: 0;
		padding: 10px 8px;
		text-align: center;
	}
	.add-preset {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 6px;
		padding: 10px;
		border: 1px dashed var(--line);
		border-radius: 12px;
		font-size: 13px;
		font-weight: 500;
		color: var(--ink-3);
	}
	.form-footer {
		padding: 14px 16px calc(14px + env(safe-area-inset-bottom, 16px));
		background: var(--paper);
		border-top: 1px solid var(--line-soft);
		display: flex;
		gap: 10px;
	}
	.btn[disabled] {
		opacity: 0.5;
	}
</style>
