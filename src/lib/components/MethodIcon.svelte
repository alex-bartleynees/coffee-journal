<script lang="ts">
	import Icon from '$lib/icons/Icon.svelte';
	import type { Method } from '$lib/data/types';

	interface Props {
		method: Method;
		size?: number;
		stroke?: string;
		strokeWidth?: number;
	}

	let { method, size = 16, stroke = 'currentColor', strokeWidth = 1.6 }: Props = $props();
</script>

<Icon name={method} {size} {stroke} {strokeWidth} />
