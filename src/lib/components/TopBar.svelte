<script lang="ts">
	import type { Snippet } from 'svelte';

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
	{#if action}
		{@render action()}
	{/if}
</div>
