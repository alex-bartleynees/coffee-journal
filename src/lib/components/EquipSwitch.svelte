<script lang="ts">
	import { page } from '$app/state';

	const items = [
		{ href: '/grinders', label: 'Grinders' },
		{ href: '/machines', label: 'Machines' },
		{ href: '/methods', label: 'Methods' }
	];
</script>

<div class="equip-switch">
	{#each items as item (item.href)}
		<a class="equip-btn" class:active={page.url.pathname === item.href} href={item.href}>
			{item.label}
		</a>
	{/each}
</div>

<style>
	.equip-switch {
		display: flex;
		margin: 0 16px 16px;
		background: var(--paper-2);
		border-radius: 10px;
		padding: 3px;
	}
	.equip-btn {
		flex: 1;
		padding: 8px 4px;
		border-radius: 7px;
		text-align: center;
		font-size: 12px;
		font-weight: 600;
		letter-spacing: 0.3px;
		color: var(--ink-3);
	}
	.equip-btn.active {
		color: var(--ink);
		background: var(--card);
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
	}

	/* Desktop already has three separate sidebar entries for these — the
	   in-page switch would just be a redundant second way to do the same nav. */
	@media (min-width: 860px) {
		.equip-switch {
			display: none;
		}
	}
</style>
