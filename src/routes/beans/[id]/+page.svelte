<script lang="ts">
	import { page } from '$app/state';
	import BackHeader from '$lib/components/BackHeader.svelte';
	import BeanDetail from '$lib/components/BeanDetail.svelte';
	import DetailActionMenu from '$lib/components/DetailActionMenu.svelte';
	import { journal } from '$lib/stores/journal.svelte';

	const bean = $derived(journal.beans.find((b) => b.id === page.params.id));
	const beanBrews = $derived(journal.brews.filter((b) => b.beanId === page.params.id));

	const referenceDate = $derived(
		journal.brews.reduce((max, b) => (b.date > max ? b.date : max), journal.brews[0]?.date ?? new Date().toISOString().slice(0, 10))
	);
</script>

{#if bean}
	<div class="screen">
		<BackHeader onBack={() => history.back()}>
			{#snippet action()}
				<DetailActionMenu editHref={`/beans/new?edit=${bean.id}`} label="Bean actions" />
			{/snippet}
		</BackHeader>

		<BeanDetail {bean} {beanBrews} {referenceDate} />
	</div>
{:else}
	<div class="screen">
		<div class="top-bar"><h1>Bean not found</h1></div>
	</div>
{/if}
