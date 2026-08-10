<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import BackHeader from '$lib/components/BackHeader.svelte';
	import Icon from '$lib/icons/Icon.svelte';
	import { journal } from '$lib/stores/journal.svelte';
	import { TASTE_DESCRIPTORS } from '$lib/data/sample';
	import { newId } from '$lib/data/id';
	import type { Bean, Roast } from '$lib/data/types';
	import { prepareBeanPhoto } from '$lib/images/bean-photo';

	const editId = $derived(page.url.searchParams.get('edit'));
	const existingBean = $derived(editId ? journal.beans.find((bean) => bean.id === editId) : undefined);
	let initializedEditId: string | null = null;

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
	let photoInput = $state<HTMLInputElement>();
	let pendingPhoto = $state<Blob | null>(null);
	let photoRemoved = $state(false);
	let photoBusy = $state(false);
	let photoError = $state<string | null>(null);
	let previewUrl = $state<string | null>(null);
	const displayedPhoto = $derived(previewUrl ?? (photoRemoved ? undefined : existingBean?.photoUrl));

	const canSave = $derived(name.trim().length > 0 && roaster.trim().length > 0);

	const roasts: { id: Roast; label: string }[] = [
		{ id: 'light', label: 'Light' },
		{ id: 'medium', label: 'Medium' },
		{ id: 'dark', label: 'Dark' }
	];

	$effect(() => {
		if (!editId || !existingBean || initializedEditId === editId) return;
		name = existingBean.name;
		roaster = existingBean.roaster;
		origin = existingBean.origin === '—' ? '' : existingBean.origin;
		process = existingBean.process === '—' ? '' : existingBean.process;
		varietal = existingBean.varietal === '—' ? '' : existingBean.varietal;
		roast = existingBean.roast;
		altitude = existingBean.altitude === '—' ? '' : existingBean.altitude;
		tasting = [...existingBean.tasting];
		const categories = Object.keys(TASTE_DESCRIPTORS);
		const firstCategory = categories[0];
		if (firstCategory) {
			const known = new Set(Object.values(TASTE_DESCRIPTORS).flat());
			customTasting[firstCategory] = existingBean.tasting.filter((item) => !known.has(item));
		}
		dateOpened = existingBean.dateOpened;
		roastDate = existingBean.roastDate;
		pricePerKg = existingBean.pricePerKg;
		bagWeight = existingBean.bagWeight;
		initializedEditId = editId;
	});

	$effect(() => {
		if (!pendingPhoto) {
			previewUrl = null;
			return;
		}
		const url = URL.createObjectURL(pendingPhoto);
		previewUrl = url;
		return () => URL.revokeObjectURL(url);
	});

	async function choosePhoto(event: Event) {
		const file = (event.currentTarget as HTMLInputElement).files?.[0];
		if (!file) return;
		photoBusy = true;
		photoError = null;
		try {
			pendingPhoto = await prepareBeanPhoto(file);
			photoRemoved = false;
		} catch (error) {
			photoError = error instanceof Error ? error.message : 'Could not process this photo.';
		} finally {
			photoBusy = false;
			if (photoInput) photoInput.value = '';
		}
	}

	function removePhoto() {
		pendingPhoto = null;
		photoRemoved = true;
		photoError = null;
	}

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
		if (editId) {
			goto(`/beans/${editId}`, { replaceState: true });
			return;
		}
		history.length > 1 ? history.back() : goto('/beans');
	}

	async function save() {
		if (!canSave) return;
		for (const category of Object.keys(TASTE_DESCRIPTORS)) addCustomTasting(category);
		const bean: Bean = {
			id: existingBean?.id ?? newId('b'),
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
			brews: existingBean?.brews ?? 0,
			finished: existingBean?.finished
		};
		if (existingBean) journal.updateBean(bean);
		else journal.addBean(bean);
		try {
			if (pendingPhoto) await journal.saveBeanPhoto(bean.id, pendingPhoto);
			else if (photoRemoved && existingBean?.photoUrl) await journal.removeBeanPhoto(bean.id);
		} catch (error) {
			photoError = error instanceof Error ? error.message : 'Could not save this photo.';
			return;
		}
		goto(`/beans/${bean.id}`, { replaceState: true });
	}
</script>

{#if editId && journal.ready && !existingBean}
	<div class="screen">
		<BackHeader onBack={() => goto('/beans')} label="Edit bean" />
		<div class="not-found">
			<h1>Bean not found</h1>
			<a class="btn btn-primary" href="/beans">Back to beans</a>
		</div>
	</div>
{:else}
<div class="screen">
	<BackHeader onBack={close} label={editId ? 'Edit bean' : 'New bean'} />

	<div class="form">
		<div class="field">
			<div class="field-label">Bag photo</div>
			<input
				class="photo-input"
				bind:this={photoInput}
				type="file"
				accept="image/*"
				capture="environment"
				onchange={choosePhoto}
			/>
			{#if displayedPhoto}
				<div class="photo-preview">
					<img src={displayedPhoto} alt="Selected coffee bag" />
					<div class="photo-actions">
						<button class="photo-button" type="button" disabled={photoBusy} onclick={() => photoInput?.click()}>
							{photoBusy ? 'Processing…' : 'Replace photo'}
						</button>
						<button class="photo-button remove" type="button" onclick={removePhoto}>Remove</button>
					</div>
				</div>
			{:else}
				<button class="photo-picker" type="button" disabled={photoBusy} onclick={() => photoInput?.click()}>
					<Icon name="plus" size={18} />
					<span>{photoBusy ? 'Processing photo…' : 'Take or choose a bag photo'}</span>
				</button>
			{/if}
			{#if photoError}<p class="photo-error" role="alert">{photoError}</p>{/if}
			<p class="photo-help">Stored only on this device. Photos are resized before saving.</p>
		</div>

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
			<Icon name="check" size={16} /> {editId ? 'Save changes' : 'Save bean'}
		</button>
	</div>
</div>
{/if}

<style>
	.form {
		padding: 16px 16px 8px;
		display: flex;
		flex-direction: column;
		gap: 14px;
	}
	.photo-input {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		clip: rect(0 0 0 0);
		white-space: nowrap;
		clip-path: inset(50%);
	}
	.photo-picker {
		min-height: 112px;
		border: 1px dashed var(--line);
		border-radius: var(--r-lg);
		background: var(--card-2);
		color: var(--ink-2);
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 8px;
		font-size: 13px;
		font-weight: 600;
	}
	.photo-preview img {
		width: 100%;
		max-height: 300px;
		object-fit: cover;
		border-radius: var(--r-lg);
		background: var(--card-2);
	}
	.photo-actions { display: flex; gap: 8px; margin-top: 8px; }
	.photo-button {
		padding: 8px 12px;
		border: 1px solid var(--line);
		border-radius: 10px;
		background: var(--card-2);
		color: var(--ink-2);
		font-size: 12px;
		font-weight: 600;
	}
	.photo-button.remove { color: var(--accent-2); }
	.photo-help, .photo-error { margin: 7px 2px 0; font-size: 11px; color: var(--ink-3); }
	.photo-error { color: var(--accent-2); }
	.not-found {
		padding: 48px 20px;
		text-align: center;
	}
	.not-found h1 {
		font-family: var(--serif);
		font-style: italic;
		font-weight: 500;
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
