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
	<div class="sync-status">Sync unavailable</div>
{:else if sync.status === 'syncing'}
	<div class="sync-status">Syncing…</div>
{:else if sync.lastSyncAt !== null}
	<div class="sync-status synced">Synced{showEmail && auth.email ? ` · ${auth.email}` : ''}</div>
{:else}
	<div class="sync-status">Checking sync…</div>
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
