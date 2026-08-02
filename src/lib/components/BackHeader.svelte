<script lang="ts">
	import Icon from '$lib/icons/Icon.svelte';
	import type { Snippet } from 'svelte';

	interface Props {
		onBack: () => void;
		label?: string;
		action?: Snippet;
	}

	let { onBack, label, action }: Props = $props();
</script>

<div class="back-header">
	<button class="icon-btn" onclick={onBack} aria-label="Back">
		<Icon name="chevronLeft" size={18} />
	</button>
	{#if label}
		<div class="back-header-label">{label}</div>
	{/if}
	<div style="flex: 1"></div>
	{#if action}
		{@render action()}
	{:else}
		<div style="width: 38px"></div>
	{/if}
</div>

<style>
	.back-header {
		padding: 56px 16px 0;
		display: flex;
		align-items: center;
		gap: 10px;
	}
	.back-header-label {
		font-size: 11px;
		letter-spacing: 1.5px;
		text-transform: uppercase;
		color: var(--ink-3);
	}
</style>
