<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import BackHeader from '$lib/components/BackHeader.svelte';
	import MachineDetail from '$lib/components/MachineDetail.svelte';
	import DetailActionMenu from '$lib/components/DetailActionMenu.svelte';
	import { journal } from '$lib/stores/journal.svelte';
	import { beanById } from '$lib/data/sample';

	const machine = $derived(journal.machines.find((m) => m.id === page.params.id));
	const beans = $derived(beanById(journal.beans));
	const myBrews = $derived(machine ? journal.brews.filter((b) => b.machine === machine.id) : []);

	function deleteMachine() {
		if (!machine) return;
		journal.deleteMachine(machine.id);
		void goto('/machines', { replaceState: true });
	}
</script>

{#if machine}
	<BackHeader onBack={() => history.back()} label="Machine">
		{#snippet action()}
			<DetailActionMenu editHref={`/machines/new?edit=${machine.id}`} label="Machine actions" onDelete={deleteMachine} />
		{/snippet}
	</BackHeader>

	<div class="screen">
		<MachineDetail {machine} {myBrews} beanById={beans} />
	</div>
{:else}
	<div class="screen">
		<div class="top-bar"><h1>Machine not found</h1></div>
	</div>
{/if}
