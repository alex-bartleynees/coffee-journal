<script lang="ts">
	import Icon from '$lib/icons/Icon.svelte';

	interface Props {
		value: number;
		size?: number;
		color?: string;
	}

	let { value, size = 11, color = 'var(--ink)' }: Props = $props();

	const stars = $derived(value / 2);
</script>

<div class="star-row" style="color:{color}">
	{#each [0, 1, 2, 3, 4] as i (i)}
		<Icon name="star" {size} filled={stars >= i + 0.5} />
	{/each}
</div>

<style>
	.star-row {
		display: inline-flex;
		gap: 1px;
	}
</style>
