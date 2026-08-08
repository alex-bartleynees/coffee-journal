<script lang="ts">
	import Icon from '$lib/icons/Icon.svelte';
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';
	import { journal } from '$lib/stores/journal.svelte';
	import { auth } from '$lib/stores/auth.svelte';
	import { sync } from '$lib/sync/engine.svelte';
	import { page } from '$app/state';
	import type { IconName } from '$lib/icons/Icon.svelte';
	import { search } from '$lib/stores/search.svelte';

	const navItems: { href: string; icon: IconName; label: string; count?: number }[] = $derived([
		{ href: '/', icon: 'journal', label: 'Journal', count: journal.brews.length },
		{ href: '/beans', icon: 'bean', label: 'Beans', count: journal.beans.length },
		{ href: '/grinders', icon: 'coffee', label: 'Grinders', count: journal.grinders.length },
		{ href: '/stats', icon: 'compare', label: 'Insights' }
	]);
</script>

<aside class="sidebar">
	<a class="brand" href="/">
		<div class="brand-mark">c</div>
		<div>
			<div class="brand-name">Bloom</div>
			<div class="brand-sub">Coffee Journal</div>
		</div>
	</a>

	<button class="search-box" type="button" onclick={search.open}>
		<Icon name="search" size={12} />
		<span>Search beans, brews…</span>
	</button>

	<nav class="nav">
		{#each navItems as item (item.href)}
			<a class="nav-item" class:active={page.url.pathname === item.href} href={item.href}>
				<span class="nav-item-icon"><Icon name={item.icon} size={14} /></span>
				<span class="nav-item-label">{item.label}</span>
				{#if item.count != null}
					<span class="nav-item-count mono">{item.count}</span>
				{/if}
			</a>
		{/each}
	</nav>

	<a class="new-brew-btn" href="/new">
		<Icon name="plus" size={12} strokeWidth={2.2} />
		New brew
	</a>

	<div class="sidebar-footer">
		{#if auth.signedIn && sync.subscriptionRequired}
			<a class="sync-status" href="/pricing">Sync off — enable Bloom Sync</a>
		{:else if auth.signedIn}
			<div class="sync-status synced">Synced{auth.email ? ` · ${auth.email}` : ''}</div>
		{:else}
			<a class="sync-status" href="/login">Not signed in — sign in to sync</a>
		{/if}
		<ThemeToggle />
	</div>
</aside>

<style>
	.sidebar {
		width: 240px;
		flex-shrink: 0;
		border-right: 1px solid var(--line-soft);
		background: var(--paper-2);
		display: flex;
		flex-direction: column;
		height: 100%;
	}
	.brand {
		padding: 20px 22px 18px;
		display: flex;
		align-items: center;
		gap: 10px;
	}
	.brand-mark {
		width: 28px;
		height: 28px;
		border-radius: 8px;
		background: linear-gradient(135deg, var(--roast-medium), var(--roast-dark));
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--paper);
		font-family: var(--serif);
		font-style: italic;
		font-size: 14px;
		font-weight: 600;
	}
	.brand-name {
		font-family: var(--serif);
		font-style: italic;
		font-size: 17px;
		font-weight: 500;
		line-height: 1;
		color: var(--ink);
	}
	.brand-sub {
		font-size: 9.5px;
		letter-spacing: 1.2px;
		text-transform: uppercase;
		color: var(--ink-3);
		margin-top: 3px;
	}
	.search-box {
		width: calc(100% - 28px);
		margin: 0 14px 12px;
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 7px 10px;
		background: var(--card-2);
		border: 1px solid var(--line-soft);
		border-radius: 8px;
		font-size: 12px;
		color: var(--ink-3);
		text-align: left;
		cursor: pointer;
	}
	.search-box:hover,
	.search-box:focus-visible {
		border-color: var(--ink-4);
		color: var(--ink-2);
		outline: none;
	}
	.nav {
		padding: 4px 8px;
		display: flex;
		flex-direction: column;
		gap: 1px;
	}
	.nav-item {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 7px 12px;
		border-radius: 7px;
		color: var(--ink-2);
		font-size: 13px;
		font-weight: 500;
		border: 1px solid transparent;
	}
	.nav-item.active {
		background: var(--card);
		color: var(--ink);
		border-color: var(--line-soft);
	}
	.nav-item-icon {
		display: inline-flex;
		color: var(--ink-3);
	}
	.nav-item-label {
		flex: 1;
	}
	.nav-item-count {
		font-size: 11px;
		color: var(--ink-4);
	}
	.new-brew-btn {
		margin: 12px 14px 0;
		padding: 9px 14px;
		border-radius: 8px;
		background: var(--ink);
		color: var(--paper);
		font-size: 12px;
		font-weight: 600;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 6px;
	}
	.sidebar-footer {
		margin-top: auto;
		padding: 14px;
		border-top: 1px solid var(--line-soft);
		display: flex;
		align-items: center;
		gap: 10px;
	}
	.sync-status {
		flex: 1;
		min-width: 0;
		font-size: 11px;
		color: var(--ink-3);
		display: block;
	}
	.sync-status.synced {
		color: var(--accent);
		font-weight: 500;
	}
</style>
