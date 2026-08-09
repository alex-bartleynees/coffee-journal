<script lang="ts">
	import { page } from '$app/state';
	import BackHeader from '$lib/components/BackHeader.svelte';
	import GrinderDetail from '$lib/components/GrinderDetail.svelte';
	import DetailActionMenu from '$lib/components/DetailActionMenu.svelte';
	import { journal } from '$lib/stores/journal.svelte';
	import { beanById } from '$lib/data/sample';

	const grinder = $derived(journal.grinders.find((g) => g.id === page.params.id));
	const beans = $derived(beanById(journal.beans));
	const myBrews = $derived(grinder ? journal.brews.filter((b) => b.grinder === grinder.id) : []);
</script>

{#if grinder}
	<BackHeader onBack={() => history.back()} label="Grinder">
		{#snippet action()}
			<DetailActionMenu editHref={`/grinders/new?edit=${grinder.id}`} label="Grinder actions" />
		{/snippet}
	</BackHeader>

	<div class="screen">
		<GrinderDetail {grinder} {myBrews} beanById={beans} />
	</div>
{:else}
	<div class="screen">
		<div class="top-bar"><h1>Grinder not found</h1></div>
	</div>
{/if}
