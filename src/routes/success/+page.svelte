<script lang="ts">
	import { onMount } from 'svelte';
	import Icon from '$lib/icons/Icon.svelte';
	import { sync } from '$lib/sync/engine.svelte';
	import {
		getSubscription,
		hasSubscriptionAccess,
		openBillingPortal,
		syncSubscription,
		type SubscriptionStatus
	} from '$lib/billing';

	let confirming = $state(true);
	let status = $state<SubscriptionStatus>('none');
	let busy = $state(false);
	let errorMsg = $state<string | null>(null);

	const hasAccess = $derived(hasSubscriptionAccess(status));
	const isPending = $derived(status === 'incomplete' || status === 'past_due');

	onMount(async () => {
		// Authoritative re-sync from Stripe, closing the race where the browser
		// returns from checkout before Stripe's webhook lands. Client-side on
		// purpose (mirrors dopamine-kick): the antiforgery cookie may have been
		// minted on this very page load, so the browser must round-trip first.
		try {
			await syncSubscription();
			status = (await getSubscription()).status;
		} catch {
			status = (await getSubscription()).status;
		} finally {
			confirming = false;
		}
		if (hasSubscriptionAccess(status)) {
			// Entitlement event is on its way / landed — kick the engine so the
			// first sync (union-merge enrollment) happens right now.
			void sync.onSignIn();
		}
	});

	async function portal() {
		busy = true;
		errorMsg = null;
		try {
			const url = await openBillingPortal();
			if (url) window.location.href = url;
			else window.location.href = '/pricing';
		} catch {
			errorMsg = "Couldn't open the billing portal. Please try again.";
			busy = false;
		}
	}
</script>

<div class="success-screen">
	<div class="success-content">
		{#if confirming && !hasAccess}
			<div class="badge badge-wait" aria-hidden="true">
				<div class="spinner"></div>
			</div>
			<h1>Confirming your payment</h1>
			<p>Just a moment while we finish setting things up.</p>
		{:else if hasAccess}
			<div class="badge badge-ok" aria-hidden="true"><Icon name="check" size={30} strokeWidth={2.5} /></div>
			<h1>You're in.</h1>
			<p>Bloom Sync is active — your journal now follows you everywhere. First sync is already running.</p>
			<a class="btn btn-accent cta" href="/">Back to your journal</a>
		{:else}
			<div class="badge badge-pending" aria-hidden="true"><Icon name="timer" size={28} /></div>
			<h1>Almost there</h1>
			<p>
				{isPending
					? 'Your payment is still processing. This can take a moment — check back shortly, or finish any required steps.'
					: "We couldn't confirm your membership yet. If a payment step is outstanding, you can complete it now."}
			</p>
			<button type="button" class="btn btn-primary cta" onclick={portal} disabled={busy}>
				{busy ? 'Opening…' : 'Complete payment'}
			</button>
			<a class="skip" href="/pricing">Back to pricing</a>
			{#if errorMsg}<p class="error-msg" role="alert">{errorMsg}</p>{/if}
		{/if}
	</div>
</div>

<style>
	.success-screen {
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--paper);
		overflow-y: auto;
	}
	.success-content {
		max-width: 400px;
		width: 100%;
		padding: 40px 28px;
		text-align: center;
	}
	.badge {
		width: 72px;
		height: 72px;
		margin: 0 auto 22px;
		border-radius: 24px;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.badge-ok {
		background: var(--accent);
		color: var(--paper);
	}
	.badge-wait {
		background: var(--card-2);
		border: 1px solid var(--line);
	}
	.badge-pending {
		background: var(--card-2);
		border: 1px solid var(--line);
		color: var(--accent);
	}
	.spinner {
		width: 28px;
		height: 28px;
		border-radius: 50%;
		border: 2.5px solid var(--line);
		border-top-color: var(--accent);
		animation: spin 0.8s linear infinite;
	}
	@keyframes spin {
		to { transform: rotate(360deg); }
	}
	h1 {
		font-family: var(--serif);
		font-size: 30px;
		font-weight: 400;
		font-style: italic;
		letter-spacing: -0.6px;
		margin: 0 0 10px;
		color: var(--ink);
		font-variation-settings: 'opsz' 144, 'SOFT' 50;
	}
	p {
		font-size: 14.5px;
		line-height: 1.55;
		color: var(--ink-2);
		margin: 0 0 24px;
	}
	.cta {
		width: 100%;
		justify-content: center;
	}
	.cta[disabled] {
		opacity: 0.6;
	}
	.skip {
		display: block;
		margin-top: 16px;
		font-size: 13.5px;
		color: var(--ink-3);
		text-decoration: underline;
		text-underline-offset: 3px;
	}
	.error-msg {
		font-size: 13px;
		color: #b3402a;
		margin: 12px 0 0;
	}
</style>
