<script lang="ts">
	import { onMount } from 'svelte';
	import '$lib/styles/app.css';
	import favicon from '$lib/assets/favicon.svg';
	import Icon from '$lib/icons/Icon.svelte';
	import Sidebar from '$lib/components/Sidebar.svelte';
	import SearchOverlay from '$lib/components/SearchOverlay.svelte';
	import { page } from '$app/state';
	import { journal } from '$lib/stores/journal.svelte';
	import { auth } from '$lib/stores/auth.svelte';
	import { sync } from '$lib/sync/engine.svelte';

	let { children } = $props();

	// Ask the browser to keep our local data (OPFS SQLite + caches) from being
	// evicted. Matters most on iOS, where non-persistent storage is cleared after
	// ~7 days of inactivity — installing to the home screen + this request is the
	// durability path for the local-first DB.
	async function requestPersistentStorage() {
		try {
			if (navigator.storage?.persist && !(await navigator.storage.persisted())) {
				await navigator.storage.persist();
			}
		} catch {
			// Non-fatal — the app still works, just without the eviction guarantee.
		}
	}

	onMount(() => {
		void requestPersistentStorage();
		Promise.all([journal.init(), auth.init()])
			.then(() => sync.start({ refresh: journal.reload }))
			.catch(console.error);
	});

	// Fires on sign-in (and on load if already signed in, harmlessly — the
	// engine no-ops until start() has run and enrollment is a one-time sentinel).
	$effect(() => {
		if (auth.signedIn) void sync.onSignIn();
	});

	const tabs = [
		{ href: '/', match: '/', icon: 'journal' as const, label: 'Journal' },
		{ href: '/beans', match: '/beans', icon: 'bean' as const, label: 'Beans' },
		{ href: '/stats', match: '/stats', icon: 'compare' as const, label: 'Stats' },
		{ href: '/grinders', match: '/grinders', icon: 'coffee' as const, label: 'Grinders' }
	];

	const isTabRoot = $derived(tabs.some((t) => t.match === page.url.pathname));
</script>

<svelte:head>
	<title>Bloom - Coffee Journal</title>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="app">
	<div class="sidebar-slot">
		<Sidebar />
	</div>

	<div class="app-main">
		{#if journal.ready && journal.error}
			<div class="db-banner db-banner--error" role="alert">
				Couldn't load your saved data. Changes won't be kept this session.
			</div>
		{:else if journal.ready && !journal.persistent}
			<div class="db-banner db-banner--warn" role="status">
				Storage isn't available. Bloom supports one open tab or app window at a time. Close any
				other Bloom tabs, then reload — changes made here won't be saved.
			</div>
		{/if}

		{@render children()}

		{#if isTabRoot}
			<nav class="bottom-nav">
				<a class="nav-btn" class:active={page.url.pathname === '/'} href="/">
					<span class="nav-icon"><Icon name="journal" size={20} /></span>
					<span>Journal</span>
				</a>
				<a class="nav-btn" class:active={page.url.pathname === '/beans'} href="/beans">
					<span class="nav-icon"><Icon name="bean" size={20} /></span>
					<span>Beans</span>
				</a>
				<a class="fab" href="/new" aria-label="New brew">
					<Icon name="plus" size={24} strokeWidth={2} />
				</a>
				<a class="nav-btn" class:active={page.url.pathname === '/stats'} href="/stats">
					<span class="nav-icon"><Icon name="compare" size={20} /></span>
					<span>Stats</span>
				</a>
				<a class="nav-btn" class:active={page.url.pathname === '/grinders'} href="/grinders">
					<span class="nav-icon"><Icon name="coffee" size={20} /></span>
					<span>Grinders</span>
				</a>
			</nav>
		{/if}
	</div>
</div>

<SearchOverlay />

<style>
	.app-main {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}
	.db-banner {
		padding: 10px 16px;
		font-size: 13px;
		line-height: 1.4;
		text-align: center;
	}
	.db-banner--warn {
		background: #fef3c7;
		color: #92400e;
	}
	.db-banner--error {
		background: #fee2e2;
		color: #991b1b;
	}
	.sidebar-slot {
		display: none;
	}

	@media (min-width: 860px) {
		:global(.app) {
			flex-direction: row;
		}
		.sidebar-slot {
			display: block;
		}
		:global(.bottom-nav) {
			display: none;
		}
		:global(.screen) {
			max-width: 1040px;
			margin: 0 auto;
		}
		:global(.top-bar) {
			padding-top: 32px;
		}
		:global(.back-header) {
			padding-top: 32px;
		}
		:global(.nb-header) {
			padding-top: 32px;
		}
		:global(.bean-list) {
			display: grid;
			grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
			align-items: start;
		}
		:global(.grinder-list) {
			display: grid;
			grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
			align-items: start;
		}
	}
</style>
