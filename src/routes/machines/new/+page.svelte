<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import BackHeader from '$lib/components/BackHeader.svelte';
	import Icon from '$lib/icons/Icon.svelte';
	import { journal } from '$lib/stores/journal.svelte';
	import { newId } from '$lib/data/id';
	import type { Machine } from '$lib/data/types';

	const editId = $derived(page.url.searchParams.get('edit'));
	const existingMachine = $derived(editId ? journal.machines.find((machine) => machine.id === editId) : undefined);
	let initializedEditId: string | null = null;

	let name = $state('');
	let maker = $state('');
	let type = $state('');
	// '' means "no method yet" — a machine can be added before its method is decided.
	let method = $state('');
	let notes = $state('');
	let initializedCreateMethod = false;

	const canSave = $derived(name.trim().length > 0 && maker.trim().length > 0);

	$effect(() => {
		if (!editId || !existingMachine || initializedEditId === editId) return;
		name = existingMachine.name;
		maker = existingMachine.maker;
		type = existingMachine.type;
		method = existingMachine.method ?? '';
		notes = existingMachine.notes ?? '';
		initializedEditId = editId;
	});

	$effect(() => {
		if (editId || initializedCreateMethod || !journal.ready) return;
		const requestedMethod = page.url.searchParams.get('method');
		if (requestedMethod && journal.methods.some((candidate) => candidate.id === requestedMethod)) {
			method = requestedMethod;
		}
		initializedCreateMethod = true;
	});

	function close() {
		if (editId) {
			goto(`/machines/${editId}`, { replaceState: true });
			return;
		}
		history.length > 1 ? history.back() : goto('/machines');
	}

	function save() {
		if (!canSave) return;
		const machine: Machine = {
			id: existingMachine?.id ?? newId('m'),
			name: name.trim(),
			maker: maker.trim(),
			type: type.trim() || '—',
			method: method || undefined,
			notes: notes.trim() || undefined
		};
		if (existingMachine) journal.updateMachine(machine);
		else journal.addMachine(machine);
		goto(`/machines/${machine.id}`, { replaceState: true });
	}
</script>

{#if editId && journal.ready && !existingMachine}
	<div class="screen">
		<BackHeader onBack={() => goto('/machines')} label="Edit machine" />
		<div class="not-found">
			<h1>Machine not found</h1>
			<a class="btn btn-primary" href="/machines">Back to machines</a>
		</div>
	</div>
{:else}
<div class="screen">
	<BackHeader onBack={close} label={editId ? 'Edit machine' : 'New machine'} />

	<div class="form">
		<div class="field">
			<div class="field-label">Name</div>
			<input class="field-input" placeholder="Lelit Bianca" bind:value={name} />
		</div>
		<div class="field">
			<div class="field-label">Maker</div>
			<input class="field-input" placeholder="Lelit" bind:value={maker} />
		</div>
		<div class="field">
			<div class="field-label">Type</div>
			<input class="field-input" placeholder="dual-boiler, manual, pourover…" bind:value={type} />
		</div>

		<div class="field">
			<div class="field-label">Method (optional — can be set later)</div>
			<div class="chip-group">
				<button type="button" class="chip" class:active={method === ''} onclick={() => (method = '')}>
					No method yet
				</button>
				{#each journal.methods as m (m.id)}
					<button type="button" class="chip" class:active={method === m.id} onclick={() => (method = m.id)}>
						{m.label}
					</button>
				{/each}
			</div>
		</div>

		<div class="field">
			<div class="field-label">Notes (optional)</div>
			<textarea class="field-input" rows="2" placeholder="Main workhorse, descaled Feb 2026…" bind:value={notes}
			></textarea>
		</div>
	</div>

	<div class="form-footer">
		<button class="btn btn-accent" style="flex: 1" disabled={!canSave} onclick={save}>
			<Icon name="check" size={16} /> {editId ? 'Save changes' : 'Save machine'}
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
