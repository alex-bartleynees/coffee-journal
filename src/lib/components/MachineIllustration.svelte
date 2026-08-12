<script lang="ts">
	import Icon from '$lib/icons/Icon.svelte';

	let { size = 64 }: { size?: number } = $props();
</script>

<div class="machine-illustration" style="width:{size}px;height:{size}px;border-radius:{size * 0.19}px;">
	<Icon name="machine" size={size * 0.5} stroke="rgba(255,235,200,0.85)" strokeWidth={1.4} />
</div>

<style>
	.machine-illustration {
		flex-shrink: 0;
		background: linear-gradient(135deg, #4a4036, #201a16);
		display: flex;
		align-items: center;
		justify-content: center;
	}
</style>
