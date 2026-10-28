<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import BackHeader from '$lib/components/BackHeader.svelte';
	import Icon from '$lib/icons/Icon.svelte';
	import { journal } from '$lib/stores/journal.svelte';
	import { newId } from '$lib/data/id';
	import RetirementToggle from '$lib/components/RetirementToggle.svelte';
	import MineralAdditionsEditor from '$lib/components/MineralAdditionsEditor.svelte';
	import { isValidMineralAddition, normalizeMineralAddition } from '$lib/data/water';
	import type { MineralAddition, WaterProfile } from '$lib/data/types';

	const editId = $derived(page.url.searchParams.get('edit'));
	const existingProfile = $derived(editId ? journal.waterProfiles.find((profile) => profile.id === editId) : undefined);
	let initializedEditId: string | null = null;

	let name = $state('');
	let base = $state('');
	// Number inputs bind null/undefined when cleared — measurements are optional.
	let gh = $state<number | null>(null);
	let kh = $state<number | null>(null);
	let tds = $state<number | null>(null);
	let notes = $state('');
	let retired = $state(false);
	let additions = $state<MineralAddition[]>([]);

	const canSave = $derived(name.trim().length > 0 && additions.every(isValidMineralAddition));

	$effect(() => {
		if (!editId || !existingProfile || initializedEditId === editId) return;
		name = existingProfile.name;
		base = existingProfile.base ?? '';
		gh = existingProfile.gh ?? null;
		kh = existingProfile.kh ?? null;
		tds = existingProfile.tds ?? null;
		notes = existingProfile.notes ?? '';
		retired = existingProfile.retired ?? false;
		additions = existingProfile.additions.map((addition) => ({ ...addition }));
		initializedEditId = editId;
	});

	function measurement(value: number | null | undefined): number | undefined {
		return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
	}

	function close() {
		if (editId) {
			goto(`/water/${editId}`, { replaceState: true });
			return;
		}
		history.length > 1 ? history.back() : goto('/water');
	}

	function save() {
		if (!canSave) return;
		const profile: WaterProfile = {
			id: existingProfile?.id ?? newId('w'),
			name: name.trim(),
			base: base.trim() || undefined,
			gh: measurement(gh),
			kh: measurement(kh),
			tds: measurement(tds),
			notes: notes.trim() || undefined,
			additions: additions.map(normalizeMineralAddition),
			retired
		};
		if (existingProfile) journal.updateWaterProfile(profile);
		else journal.addWaterProfile(profile);
		goto(`/water/${profile.id}`, { replaceState: true });
	}
</script>

{#if editId && journal.ready && !existingProfile}
	<div class="screen">
		<BackHeader onBack={() => goto('/water')} label="Edit water" />
		<div class="not-found">
			<h1>Water profile not found</h1>
			<a class="btn btn-primary" href="/water">Back to water</a>
		</div>
	</div>
{:else}
<div class="screen">
	<BackHeader onBack={close} label={editId ? 'Edit water' : 'New water'} />

	<div class="form">
		<div class="field">
			<div class="field-label">Name</div>
			<input class="field-input" placeholder="Filtered tap + Apax" bind:value={name} />
		</div>
		<div class="field">
			<div class="field-label">Base water (optional)</div>
			<input class="field-input" placeholder="Brita filtered tap, distilled, Volvic…" bind:value={base} />
		</div>

		<div class="field">
			<div class="field-label">Measurements (optional, ppm)</div>
			<div class="measurements">
				<label><span>GH</span><input class="field-input" type="number" inputmode="decimal" min="0" bind:value={gh} /></label>
				<label><span>KH</span><input class="field-input" type="number" inputmode="decimal" min="0" bind:value={kh} /></label>
				<label><span>TDS</span><input class="field-input" type="number" inputmode="decimal" min="0" bind:value={tds} /></label>
			</div>
		</div>

		<MineralAdditionsEditor bind:additions />

		<div class="field">
			<div class="field-label">Notes (optional)</div>
			<textarea class="field-input" rows="2" placeholder="Shake the bottle first…" bind:value={notes}></textarea>
		</div>

		<RetirementToggle bind:retired noun="water profile" />
	</div>

	<div class="form-footer">
		<button class="btn btn-accent" style="flex: 1" disabled={!canSave} onclick={save}>
			<Icon name="check" size={16} /> {editId ? 'Save changes' : 'Save water'}
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
	.measurements {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 8px;
	}
	.measurements label {
		display: flex;
		flex-direction: column;
		gap: 3px;
		min-width: 0;
	}
	.measurements span {
		font-size: 9px;
		letter-spacing: 1px;
		text-transform: uppercase;
		color: var(--ink-3);
	}
	.measurements .field-input {
		width: 100%;
		min-width: 0;
	}
	.not-found {
		padding: 48px 20px;
		text-align: center;
	}
	.not-found h1 {
		font-family: var(--serif);
		font-style: italic;
		font-weight: 500;
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
