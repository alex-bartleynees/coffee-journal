<script lang="ts">
	import { auth } from '$lib/stores/auth.svelte';
	import { sync } from '$lib/sync/engine.svelte';

	let { showEmail = false }: { showEmail?: boolean } = $props();
</script>

{#if !auth.checked}
	<div class="sync-status">Checking account…</div>
{:else if !auth.signedIn}
	<a class="sync-status" href="/login">Not signed in — sign in to sync</a>
{:else if sync.subscriptionRequired}
	<a class="sync-status" href="/pricing">Sync off — enable Bloom Sync</a>
{:else if sync.status === 'error'}
	<a class="sync-status" href="/account">Sync unavailable</a>
{:else if sync.status === 'syncing'}
	<a class="sync-status" href="/account">Syncing…</a>
{:else if sync.lastSyncAt !== null}
	<a class="sync-status synced" href="/account">Synced{showEmail && auth.email ? ` · ${auth.email}` : ''}</a>
{:else}
	<a class="sync-status" href="/account">Checking sync…</a>
{/if}

<style>
	.sync-status {
		font-size: 11px;
		color: var(--ink-3);
		display: block;
	}
	.sync-status.synced {
		color: var(--accent);
		font-weight: 500;
	}
</style>
