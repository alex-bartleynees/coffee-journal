<script lang="ts">
	import type { Roast } from '$lib/data/types';

	interface Props {
		roast: Roast;
		roaster?: string;
		photoUrl?: string;
		width?: number;
		height?: number;
	}

	let { roast, roaster, photoUrl, width = 64, height = 76 }: Props = $props();

	const gradients: Record<Roast, string> = {
		light: 'linear-gradient(155deg, #E8D2B0, #C9A57B)',
		medium: 'linear-gradient(155deg, #A06A42, #6B3F26)',
		dark: 'linear-gradient(155deg, #4A2C1F, #2A1810)'
	};
</script>

<div class="bean-bag" class:has-photo={photoUrl} style="width:{width}px;height:{height}px;background:{gradients[roast]};">
	{#if photoUrl}<img src={photoUrl} alt="" />{/if}
	<div class="pinch"></div>
	{#if roaster}
		<div class="label">{roaster.split(' ')[0]}</div>
	{/if}
</div>

<style>
	.bean-bag {
		border-radius: 6px;
		position: relative;
		flex-shrink: 0;
		box-shadow:
			inset 0 -8px 20px rgba(0, 0, 0, 0.2),
			inset 0 0 0 1px rgba(0, 0, 0, 0.1);
		display: flex;
		align-items: flex-end;
		justify-content: center;
		padding: 6px;
	}
	.bean-bag.has-photo { padding: 0; overflow: hidden; }
	.bean-bag img { width: 100%; height: 100%; object-fit: cover; }
	.bean-bag.has-photo .pinch,
	.bean-bag.has-photo .label { display: none; }
	.pinch {
		position: absolute;
		top: 4px;
		left: 6px;
		right: 6px;
		height: 8px;
		background: rgba(0, 0, 0, 0.2);
		border-radius: 1px;
		border-top: 1px solid rgba(255, 255, 255, 0.15);
	}
	.label {
		background: rgba(255, 255, 255, 0.92);
		width: 100%;
		padding: 3px 4px;
		font-family: var(--serif);
		font-size: 8px;
		font-style: italic;
		text-align: center;
		color: var(--ink);
		line-height: 1;
		border-radius: 1px;
	}
</style>
