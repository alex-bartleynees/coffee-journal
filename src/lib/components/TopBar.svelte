<script lang="ts">
	import type { Snippet } from 'svelte';
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';

	interface Props {
		sub?: string;
		title: string;
		action?: Snippet;
	}

	let { sub, title, action }: Props = $props();
</script>

<div class="top-bar">
	<div>
		{#if sub}<div class="sub">{sub}</div>{/if}
		<h1>{title}</h1>
	</div>
	<div class="top-bar-actions">
		<!-- Mobile-only: on desktop the Sidebar hosts the theme toggle instead. -->
		<span class="top-bar-theme"><ThemeToggle /></span>
		{#if action}
			{@render action()}
		{/if}
	</div>
</div>

<style>
	.top-bar-actions {
		display: flex;
		align-items: center;
		gap: 10px;
	}
	@media (min-width: 860px) {
		.top-bar-theme {
			display: none;
		}
	}
</style>
