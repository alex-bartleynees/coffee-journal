<script lang="ts">
	import { page } from '$app/state';
	import BackHeader from '$lib/components/BackHeader.svelte';
	import GrinderDetail from '$lib/components/GrinderDetail.svelte';
	import Icon from '$lib/icons/Icon.svelte';
	import { journal } from '$lib/stores/journal.svelte';
	import { beanById } from '$lib/data/sample';

	const grinder = $derived(journal.grinders.find((g) => g.id === page.params.id));
	const beans = $derived(beanById(journal.beans));
	const myBrews = $derived(grinder ? journal.brews.filter((b) => b.grinder === grinder.id) : []);
</script>

{#if grinder}
	<BackHeader onBack={() => history.back()} label="Grinder">
		{#snippet action()}
			<button class="icon-btn"><Icon name="dots" size={16} /></button>
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
