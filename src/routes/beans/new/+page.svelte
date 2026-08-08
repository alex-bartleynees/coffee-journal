<script lang="ts">
	import { goto } from '$app/navigation';
	import BackHeader from '$lib/components/BackHeader.svelte';
	import Icon from '$lib/icons/Icon.svelte';
	import { journal } from '$lib/stores/journal.svelte';
	import { TASTE_DESCRIPTORS } from '$lib/data/sample';
	import { newId } from '$lib/data/id';
	import type { Bean, Roast } from '$lib/data/types';

	const today = journal.brews.reduce(
		(max, b) => (b.date > max ? b.date : max),
		journal.brews[0]?.date ?? new Date().toISOString().slice(0, 10)
	);

	let name = $state('');
	let roaster = $state('');
	let origin = $state('');
	let process = $state('');
	let varietal = $state('');
	let roast = $state<Roast>('medium');
	let altitude = $state('');
	let tasting = $state<string[]>([]);
	let customTasting = $state<Record<string, string[]>>(
		Object.fromEntries(Object.keys(TASTE_DESCRIPTORS).map((category) => [category, []]))
	);
	let customTastingInput = $state<Record<string, string>>(
		Object.fromEntries(Object.keys(TASTE_DESCRIPTORS).map((category) => [category, '']))
	);
	let dateOpened = $state(today);
	let roastDate = $state(today);
	let pricePerKg = $state(60);
	let bagWeight = $state(250);

	const canSave = $derived(name.trim().length > 0 && roaster.trim().length > 0);

	const roasts: { id: Roast; label: string }[] = [
		{ id: 'light', label: 'Light' },
		{ id: 'medium', label: 'Medium' },
		{ id: 'dark', label: 'Dark' }
	];

	function toggleTasting(t: string) {
		tasting = tasting.includes(t) ? tasting.filter((x) => x !== t) : [...tasting, t];
	}

	function addCustomTasting(category: string) {
		const note = customTastingInput[category].trim();
		if (!note) return;

		const existing = tasting.find((item) => item.toLocaleLowerCase() === note.toLocaleLowerCase());
		if (!existing) {
			tasting = [...tasting, note];
			customTasting[category] = [...customTasting[category], note];
		}
		customTastingInput[category] = '';
	}

	function removeCustomTasting(category: string, note: string) {
		customTasting[category] = customTasting[category].filter((item) => item !== note);
		tasting = tasting.filter((item) => item !== note);
	}

	function close() {
		history.length > 1 ? history.back() : goto('/beans');
	}

	function save() {
		if (!canSave) return;
		for (const category of Object.keys(TASTE_DESCRIPTORS)) addCustomTasting(category);
		const bean: Bean = {
			id: newId('b'),
			name: name.trim(),
			roaster: roaster.trim(),
			origin: origin.trim() || '—',
			process: process.trim() || '—',
			varietal: varietal.trim() || '—',
			roast,
			altitude: altitude.trim() || '—',
			tasting,
			dateOpened,
			roastDate,
			pricePerKg,
			bagWeight,
			brews: 0
		};
		journal.addBean(bean);
		goto(`/beans/${bean.id}`);
	}
</script>

<div class="screen">
	<BackHeader onBack={close} label="New bean" />

	<div class="form">
		<div class="field">
			<div class="field-label">Name</div>
			<input class="field-input" placeholder="Suke Quto" bind:value={name} />
		</div>
		<div class="field">
			<div class="field-label">Roaster</div>
			<input class="field-input" placeholder="Onyx Coffee Lab" bind:value={roaster} />
		</div>

		<div class="field-row">
			<div class="field">
				<div class="field-label">Origin</div>
				<input class="field-input" placeholder="Ethiopia, Guji" bind:value={origin} />
			</div>
			<div class="field">
				<div class="field-label">Process</div>
				<input class="field-input" placeholder="Natural" bind:value={process} />
			</div>
		</div>

		<div class="field-row">
			<div class="field">
				<div class="field-label">Varietal</div>
				<input class="field-input" placeholder="Heirloom" bind:value={varietal} />
			</div>
			<div class="field">
				<div class="field-label">Altitude</div>
				<input class="field-input" placeholder="1900–2200m" bind:value={altitude} />
			</div>
		</div>

		<div class="field">
			<div class="field-label">Roast</div>
			<div class="segmented">
				{#each roasts as r (r.id)}
					<button class="seg-btn" class:selected={roast === r.id} onclick={() => (roast = r.id)}>
						{r.label}
					</button>
				{/each}
			</div>
		</div>

		<div class="field-row">
			<div class="field">
				<div class="field-label">Date opened</div>
				<input class="field-input" type="date" bind:value={dateOpened} />
			</div>
			<div class="field">
				<div class="field-label">Roast date</div>
				<input class="field-input" type="date" bind:value={roastDate} />
			</div>
		</div>

		<div class="field-row">
			<div class="field">
				<div class="field-label">Price / kg</div>
				<input class="field-input" type="number" min="0" step="1" bind:value={pricePerKg} />
			</div>
			<div class="field">
				<div class="field-label">Bag weight (g)</div>
				<input class="field-input" type="number" min="0" step="1" bind:value={bagWeight} />
			</div>
		</div>

		<div class="section-label">Tasting notes</div>
		{#each Object.entries(TASTE_DESCRIPTORS) as [cat, items] (cat)}
			<div class="cat-block">
				<div class="cat-label">{cat}</div>
				<div class="chip-group">
					{#each items as item (item)}
						<button class="chip" class:active={tasting.includes(item)} onclick={() => toggleTasting(item)}>
							{item}
						</button>
					{/each}
					{#each customTasting[cat] as note (note)}
						<button
							class="chip active custom-chip"
							onclick={() => removeCustomTasting(cat, note)}
							aria-label={`Remove ${note}`}
						>
							{note}<span aria-hidden="true">×</span>
						</button>
					{/each}
				</div>
				<div class="custom-note-row">
					<input
						class="field-input custom-note-input"
						placeholder={`Add your own ${cat.toLocaleLowerCase()} note`}
						aria-label={`Custom ${cat.toLocaleLowerCase()} tasting note`}
						bind:value={customTastingInput[cat]}
						onkeydown={(event) => {
							if (event.key === 'Enter') {
								event.preventDefault();
								addCustomTasting(cat);
							}
						}}
					/>
					<button
						class="add-note-btn"
						disabled={!customTastingInput[cat].trim()}
						onclick={() => addCustomTasting(cat)}>Add</button
					>
				</div>
			</div>
		{/each}
	</div>

	<div class="form-footer">
		<button class="btn btn-accent" style="flex: 1" disabled={!canSave} onclick={save}>
			<Icon name="check" size={16} /> Save bean
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
	}
	.seg-btn.selected {
		background: var(--ink);
		color: var(--paper);
	}
	.cat-block {
		margin-bottom: 14px;
	}
	.cat-label {
		font-size: 11px;
		letter-spacing: 1.2px;
		text-transform: uppercase;
		color: var(--ink-3);
		font-weight: 500;
		margin-bottom: 6px;
	}
	.custom-chip span {
		font-size: 15px;
		line-height: 10px;
		opacity: 0.75;
	}
	.custom-note-row {
		display: flex;
		gap: 8px;
		margin-top: 8px;
	}
	.custom-note-input {
		min-width: 0;
		padding: 9px 12px;
		font-size: 14px;
	}
	.add-note-btn {
		padding: 0 14px;
		border: 1px solid var(--line);
		border-radius: 12px;
		background: var(--card-2);
		color: var(--ink-2);
		font-size: 13px;
		font-weight: 600;
	}
	.add-note-btn:disabled {
		opacity: 0.45;
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
