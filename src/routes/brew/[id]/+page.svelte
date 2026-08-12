<script lang="ts">
	import { page } from '$app/state';
	import BackHeader from '$lib/components/BackHeader.svelte';
	import BrewDetail from '$lib/components/BrewDetail.svelte';
	import DetailActionMenu from '$lib/components/DetailActionMenu.svelte';
	import Icon from '$lib/icons/Icon.svelte';
	import { journal } from '$lib/stores/journal.svelte';
	import { beanById } from '$lib/data/sample';

	const brew = $derived(journal.brews.find((b) => b.id === page.params.id));
	const beans = $derived(beanById(journal.beans));
	const bean = $derived(brew ? beans[brew.beanId] : undefined);
	const grinder = $derived(brew ? journal.grinders.find((g) => g.id === brew.grinder) : undefined);
	const machine = $derived(brew?.machine ? journal.machines.find((m) => m.id === brew.machine) : undefined);

	const prevBrew = $derived.by(() => {
		if (!brew) return undefined;
		return journal.brews
			.filter((b) => b.beanId === brew.beanId && b.id !== brew.id && b.date <= brew.date)
			.sort((a, b) => b.date.localeCompare(a.date))[0];
	});
	const prevBean = $derived(prevBrew ? beans[prevBrew.beanId] : undefined);
</script>

{#if brew && bean}
	<div class="screen">
		<BackHeader onBack={() => history.back()}>
			{#snippet action()}
				<div style="display:flex; gap:8px">
					{#if prevBrew}
						<a class="icon-btn" href="/brew/{brew.id}/compare" title="Compare to last">
							<Icon name="compare" size={16} />
						</a>
					{/if}
					<DetailActionMenu editHref={`/new?edit=${brew.id}`} label="Brew actions" />
				</div>
			{/snippet}
		</BackHeader>

		<BrewDetail {brew} {bean} {grinder} {machine} {prevBrew} {prevBean} />
	</div>
{:else}
	<div class="screen">
		<div class="top-bar"><h1>Brew not found</h1></div>
	</div>
{/if}
