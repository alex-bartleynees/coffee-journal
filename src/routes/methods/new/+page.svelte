<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import BackHeader from '$lib/components/BackHeader.svelte';
	import Icon from '$lib/icons/Icon.svelte';
	import { journal } from '$lib/stores/journal.svelte';
	import { newId } from '$lib/data/id';
	import type { MethodDef } from '$lib/data/types';
	import type { IconName } from '$lib/icons/Icon.svelte';

	const editId = $derived(page.url.searchParams.get('edit'));
	const existingMethod = $derived(editId ? journal.methods.find((method) => method.id === editId) : undefined);
	let initializedEditId: string | null = null;

	const ICON_CHOICES: IconName[] = ['espresso', 'v60', 'aeropress', 'cup', 'coffee', 'machine', 'droplet', 'leaf', 'timer'];

	let label = $state('');
	let icon = $state<IconName>('cup');
	let notes = $state('');

	const canSave = $derived(label.trim().length > 0);

	$effect(() => {
		if (!editId || !existingMethod || initializedEditId === editId) return;
		label = existingMethod.label;
		icon = existingMethod.icon;
		notes = existingMethod.notes ?? '';
		initializedEditId = editId;
	});

	function close() {
		if (editId) {
			goto(`/methods/${editId}`, { replaceState: true });
			return;
		}
		history.length > 1 ? history.back() : goto('/methods');
	}

	function save() {
		if (!canSave) return;
		const method: MethodDef = {
			id: existingMethod?.id ?? newId('meth'),
			label: label.trim(),
			icon,
			notes: notes.trim() || undefined
		};
		if (existingMethod) journal.updateMethod(method);
		else journal.addMethod(method);
		goto(`/methods/${method.id}`, { replaceState: true });
	}
</script>

{#if editId && journal.ready && !existingMethod}
	<div class="screen">
		<BackHeader onBack={() => goto('/methods')} label="Edit method" />
		<div class="not-found">
			<h1>Method not found</h1>
			<a class="btn btn-primary" href="/methods">Back to methods</a>
		</div>
	</div>
{:else}
<div class="screen">
	<BackHeader onBack={close} label={editId ? 'Edit method' : 'New method'} />

	<div class="form">
		<div class="field">
			<div class="field-label">Label</div>
			<input class="field-input" placeholder="Moka pot" bind:value={label} />
		</div>

		<div class="field">
			<div class="field-label">Icon</div>
			<div class="icon-grid">
				{#each ICON_CHOICES as opt (opt)}
					<button type="button" class="icon-option" class:selected={icon === opt} onclick={() => (icon = opt)}>
						<Icon name={opt} size={22} strokeWidth={1.4} />
					</button>
				{/each}
			</div>
		</div>

		<div class="field">
			<div class="field-label">Notes (optional)</div>
			<textarea
				class="field-input"
				rows="3"
				placeholder="Technique, baseline recipe, or equipment notes…"
				bind:value={notes}
			></textarea>
		</div>
	</div>

	<div class="form-footer">
		<button class="btn btn-accent" style="flex: 1" disabled={!canSave} onclick={save}>
			<Icon name="check" size={16} /> {editId ? 'Save changes' : 'Save method'}
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
	.not-found {
		padding: 48px 20px;
		text-align: center;
	}
	.not-found h1 {
		font-family: var(--serif);
		font-style: italic;
		font-weight: 500;
	}
	.icon-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(48px, 1fr));
		gap: 8px;
	}
	.icon-option {
		padding: 12px 0;
		border-radius: var(--r-md);
		border: 1px solid var(--line);
		background: var(--card-2);
		color: var(--ink-3);
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.icon-option.selected {
		border: 1.5px solid var(--ink);
		background: var(--card);
		color: var(--ink);
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
