<script lang="ts">
	import TopBar from '$lib/components/TopBar.svelte';
	import EquipSwitch from '$lib/components/EquipSwitch.svelte';
	import MachineCard from '$lib/components/MachineCard.svelte';
	import MachineDetail from '$lib/components/MachineDetail.svelte';
	import DetailActionMenu from '$lib/components/DetailActionMenu.svelte';
	import Icon from '$lib/icons/Icon.svelte';
	import { journal } from '$lib/stores/journal.svelte';
	import { beanById } from '$lib/data/sample';

	const machines = $derived(journal.machines);
	const brews = $derived(journal.brews);
	const beans = $derived(beanById(journal.beans));

	const counts = $derived.by(() => {
		const c: Record<string, number> = {};
		brews.forEach((b) => { if (b.machine) c[b.machine] = (c[b.machine] || 0) + 1; });
		return c;
	});

	// Desktop split-pane: rail stays on the left, detail renders on the right
	// instead of navigating. Mobile ignores this and navigates normally.
	let selectedMachineId = $state<string | undefined>(undefined);
	const effectiveSelectedId = $derived(selectedMachineId ?? machines[0]?.id);
	const selectedMachine = $derived(machines.find((m) => m.id === effectiveSelectedId));
	const selectedMachineBrews = $derived(
		selectedMachine ? brews.filter((b) => b.machine === selectedMachine.id) : []
	);

	function onMachineCardClick(e: MouseEvent, id: string) {
		if (window.matchMedia('(min-width: 860px)').matches) {
			e.preventDefault();
			selectedMachineId = id;
		}
	}

	function deleteSelectedMachine() {
		if (!selectedMachine) return;
		journal.deleteMachine(selectedMachine.id);
		selectedMachineId = undefined;
	}
</script>

<div class="machines-shell">
	<div class="screen">
		<TopBar sub="Equipment" title="Machines">
			{#snippet action()}
				<a class="icon-btn" href="/machines/new" aria-label="Add machine"><Icon name="plus" size={18} /></a>
			{/snippet}
		</TopBar>

		<EquipSwitch />

		<div class="section-label">Library</div>
		<div class="machine-list">
			{#each machines as m (m.id)}
				<MachineCard
					machine={m}
					brewCount={counts[m.id] || 0}
					selected={m.id === effectiveSelectedId}
					onclick={(e) => onMachineCardClick(e, m.id)}
				/>
			{/each}
			<a class="add-machine" href="/machines/new">
				<Icon name="plus" size={14} /> Add machine
			</a>
		</div>
	</div>

	{#if selectedMachine}
		<div class="machines-detail-pane">
			<div class="desktop-detail-actions">
				<DetailActionMenu
					editHref={`/machines/new?edit=${selectedMachine.id}`}
					label="Machine actions"
					onDelete={deleteSelectedMachine}
				/>
			</div>
			<MachineDetail machine={selectedMachine} myBrews={selectedMachineBrews} beanById={beans} />
		</div>
	{/if}
</div>

<style>
	.machine-list {
		display: flex;
		flex-direction: column;
		gap: 12px;
		padding: 0 16px 24px;
	}
	.add-machine {
		padding: 14px;
		border-radius: var(--r-lg);
		border: 1px dashed var(--line);
		color: var(--ink-3);
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 6px;
		font-size: 13px;
		font-weight: 500;
	}

	:global(.machines-shell) {
		display: flex;
		flex: 1;
		min-height: 0;
	}

	.machines-detail-pane {
		display: none;
	}
	.desktop-detail-actions {
		display: flex;
		justify-content: flex-end;
		padding: 32px 16px 0;
	}

	@media (min-width: 860px) {
		:global(.machines-shell .screen) {
			max-width: none;
			margin: 0;
			width: 360px;
			flex-shrink: 0;
			border-right: 1px solid var(--line-soft);
			overflow-y: auto;
		}
		.machines-detail-pane {
			display: block;
			flex: 1;
			min-width: 0;
			overflow-y: auto;
		}
	}
</style>
