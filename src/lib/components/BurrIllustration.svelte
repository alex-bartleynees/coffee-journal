<script lang="ts">
	import type { GrinderType } from '$lib/data/types';

	interface Props {
		type: GrinderType;
		size?: number;
	}

	let { type, size = 64 }: Props = $props();

	const svgSize = $derived(size * 0.7);
	const conicalTeeth = Array.from({ length: 16 }, (_, i) => (i / 16) * Math.PI * 2);
	const flatTeeth = Array.from({ length: 24 }, (_, i) => (i / 24) * Math.PI * 2);
</script>

<div
	class="burr"
	style="width:{size}px;height:{size}px;border-radius:{size * 0.18}px;background:{type === 'espresso'
		? 'linear-gradient(135deg, #4A4036, #2C2520)'
		: 'linear-gradient(135deg, #6E6657, #3D3629)'};"
>
	<svg width={svgSize} height={svgSize} viewBox="0 0 44 44">
		{#if type === 'espresso'}
			<circle cx="22" cy="22" r="16" stroke="rgba(255,235,200,0.85)" stroke-width="1.2" fill="none" />
			<circle cx="22" cy="22" r="10" stroke="rgba(255,235,200,0.5)" stroke-width="0.8" fill="none" />
			<circle cx="22" cy="22" r="3" fill="rgba(255,235,200,0.85)" />
			{#each conicalTeeth as a (a)}
				<line
					x1={22 + Math.cos(a) * 10}
					y1={22 + Math.sin(a) * 10}
					x2={22 + Math.cos(a) * 16}
					y2={22 + Math.sin(a) * 16}
					stroke="rgba(255,235,200,0.7)"
					stroke-width="0.7"
				/>
			{/each}
		{:else}
			<circle cx="22" cy="22" r="16" stroke="rgba(255,235,200,0.85)" stroke-width="1.2" fill="none" />
			<circle cx="22" cy="22" r="13" stroke="rgba(255,235,200,0.5)" stroke-width="0.6" fill="none" />
			<circle cx="22" cy="22" r="7" stroke="rgba(255,235,200,0.5)" stroke-width="0.6" fill="none" />
			{#each flatTeeth as a (a)}
				<line
					x1={22 + Math.cos(a) * 7}
					y1={22 + Math.sin(a) * 7}
					x2={22 + Math.cos(a) * 16}
					y2={22 + Math.sin(a) * 16}
					stroke="rgba(255,235,200,0.55)"
					stroke-width="0.5"
				/>
			{/each}
		{/if}
	</svg>
</div>

<style>
	.burr {
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.1);
	}
</style>
