<script lang="ts">
	import type { Roast } from '$lib/data/types';

	interface Props {
		roast: Roast;
		size?: number;
	}

	let { roast, size = 7 }: Props = $props();

	const colors: Record<Roast, string> = { light: '#C9A57B', medium: '#8E5A3B', dark: '#4A2C1F' };
</script>

<span
	class="roast-dot"
	style="width:{size}px;height:{size}px;background:{colors[roast]};box-shadow:0 0 0 1.5px var(--paper), 0 0 0 2.5px {colors[roast]}40;"
></span>

<style>
	.roast-dot {
		display: inline-block;
		border-radius: 50%;
		flex-shrink: 0;
	}
</style>
