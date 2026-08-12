<script lang="ts">
	import { onMount, tick } from 'svelte';
	import Icon from '$lib/icons/Icon.svelte';

	let {
		editHref,
		label,
		onDelete
	}: { editHref: string; label: string; onDelete?: () => void } = $props();

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

	function requestDelete() {
		close();
		if (onDelete && window.confirm('Delete this item? This cannot be undone.')) onDelete();
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
				{#if onDelete}
					<button class="delete-item" role="menuitem" type="button" onclick={requestDelete}>Delete</button>
				{/if}
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
	.menu a,
	.menu button {
		display: block;
		width: 100%;
		padding: 10px 12px;
		border-radius: 6px;
		font-size: 14px;
		font-weight: 500;
		color: var(--ink);
		text-align: left;
	}
	.menu a:hover,
	.menu a:focus-visible,
	.menu button:hover,
	.menu button:focus-visible {
		background: var(--paper-2);
		outline: none;
	}
	.menu .delete-item { color: var(--danger, #a33a2b); }
</style>
