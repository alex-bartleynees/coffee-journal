<script lang="ts">
	import Icon from '$lib/icons/Icon.svelte';
	import { journal } from '$lib/stores/journal.svelte';
	import type { Method } from '$lib/data/types';

	interface Props {
		method: Method;
		size?: number;
		stroke?: string;
		strokeWidth?: number;
	}

	let { method, size = 16, stroke = 'currentColor', strokeWidth = 1.6 }: Props = $props();

	// Custom user-added methods without a matching icon fall back to the generic cup.
	const iconName = $derived(journal.methods.find((m) => m.id === method)?.icon ?? 'cup');
</script>

<Icon name={iconName} {size} {stroke} {strokeWidth} />
