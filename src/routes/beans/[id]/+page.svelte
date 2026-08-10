<script lang="ts">
	import { page } from '$app/state';
	import BackHeader from '$lib/components/BackHeader.svelte';
	import BeanDetail from '$lib/components/BeanDetail.svelte';
	import DetailActionMenu from '$lib/components/DetailActionMenu.svelte';
	import { journal } from '$lib/stores/journal.svelte';

	const bean = $derived(journal.beans.find((b) => b.id === page.params.id));
	const beanBrews = $derived(journal.brews.filter((b) => b.beanId === page.params.id));
</script>

{#if bean}
	<div class="screen">
		<BackHeader onBack={() => history.back()}>
			{#snippet action()}
				<DetailActionMenu editHref={`/beans/new?edit=${bean.id}`} label="Bean actions" />
			{/snippet}
		</BackHeader>

		<BeanDetail {bean} {beanBrews} />
	</div>
{:else}
	<div class="screen">
		<div class="top-bar"><h1>Bean not found</h1></div>
	</div>
{/if}
