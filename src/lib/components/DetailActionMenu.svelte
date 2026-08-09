<script lang="ts">
	import { onMount, tick } from 'svelte';
	import Icon from '$lib/icons/Icon.svelte';

	let { editHref, label }: { editHref: string; label: string } = $props();

	let open = $state(false);
	let root: HTMLDivElement;
	let trigger: HTMLButtonElement;

	function close({ restoreFocus = false } = {}) {
		open = false;
		if (restoreFocus) void tick().then(() => trigger.focus());
	}

	function onKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape' && open) {
			event.preventDefault();
			close({ restoreFocus: true });
		}
	}

	onMount(() => {
		function onPointerDown(event: PointerEvent) {
			if (open && !root.contains(event.target as Node)) close();
		}
		document.addEventListener('pointerdown', onPointerDown);
		return () => document.removeEventListener('pointerdown', onPointerDown);
	});
</script>

<svelte:window onkeydown={onKeydown} />

<div
	class="action-menu"
	bind:this={root}
	onfocusout={(event) => {
		if (!root.contains(event.relatedTarget as Node | null)) close();
	}}
>
	<button
		class="icon-btn"
		bind:this={trigger}
		type="button"
		aria-label={label}
		aria-haspopup="menu"
		aria-expanded={open}
		onclick={() => (open = !open)}
	>
		<Icon name="dots" size={18} />
	</button>
	{#if open}
		<div class="menu" role="menu" aria-label={label}>
			<a role="menuitem" href={editHref} onclick={() => close()}>Edit</a>
		</div>
	{/if}
</div>

<style>
	.action-menu {
		position: relative;
	}
	.menu {
		position: absolute;
		top: calc(100% + 6px);
		right: 0;
		z-index: 20;
		min-width: 132px;
		padding: 5px;
		background: var(--card);
		border: 1px solid var(--line-soft);
		border-radius: var(--r-sm);
		box-shadow: 0 10px 28px rgba(26, 23, 20, 0.16);
	}
	.menu a {
		display: block;
		padding: 10px 12px;
		border-radius: 6px;
		font-size: 14px;
		font-weight: 500;
		color: var(--ink);
	}
	.menu a:hover,
	.menu a:focus-visible {
		background: var(--paper-2);
		outline: none;
	}
</style>
