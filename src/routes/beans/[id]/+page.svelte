<script lang="ts">
	import { page } from '$app/state';
	import BackHeader from '$lib/components/BackHeader.svelte';
	import BeanDetail from '$lib/components/BeanDetail.svelte';
	import Icon from '$lib/icons/Icon.svelte';
	import { journal } from '$lib/stores/journal.svelte';

	const bean = $derived(journal.beans.find((b) => b.id === page.params.id));
	const beanBrews = $derived(journal.brews.filter((b) => b.beanId === page.params.id));

	const referenceDate = $derived(
		journal.brews.reduce((max, b) => (b.date > max ? b.date : max), journal.brews[0]?.date ?? '')
	);
</script>

{#if bean}
	<div class="screen">
		<BackHeader onBack={() => history.back()}>
			{#snippet action()}
				<button class="icon-btn"><Icon name="dots" size={18} /></button>
			{/snippet}
		</BackHeader>

		<BeanDetail {bean} {beanBrews} {referenceDate} />
	</div>
{:else}
	<div class="screen">
		<div class="top-bar"><h1>Bean not found</h1></div>
	</div>
{/if}
