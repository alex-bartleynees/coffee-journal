<script lang="ts">
	import { page } from '$app/state';
	import BackHeader from '$lib/components/BackHeader.svelte';
	import MethodDetail from '$lib/components/MethodDetail.svelte';
	import DetailActionMenu from '$lib/components/DetailActionMenu.svelte';
	import { journal } from '$lib/stores/journal.svelte';
	import { beanById } from '$lib/data/sample';

	const method = $derived(journal.methods.find((m) => m.id === page.params.id));
	const beans = $derived(beanById(journal.beans));
	const machines = $derived(method ? journal.machines.filter((m) => m.method === method.id) : []);
	const myBrews = $derived(method ? journal.brews.filter((b) => b.method === method.id) : []);
	const recipes = $derived(method ? journal.recipes.filter((recipe) => recipe.methodId === method.id) : []);

	function deleteRecipe(id: string) {
		if (confirm('Delete this recipe? Saved brews will keep their recorded measurements.')) journal.deleteRecipe(id);
	}
</script>

{#if method}
	<BackHeader onBack={() => history.back()} label="Method">
		{#snippet action()}
			<DetailActionMenu editHref={`/methods/new?edit=${method.id}`} label="Method actions" />
		{/snippet}
	</BackHeader>

	<div class="screen">
		<MethodDetail {method} {machines} {myBrews} {recipes} onDeleteRecipe={deleteRecipe} beanById={beans} />
	</div>
{:else}
	<div class="screen">
		<div class="top-bar"><h1>Method not found</h1></div>
	</div>
{/if}
