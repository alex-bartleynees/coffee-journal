<script lang="ts">
	import { goto } from '$app/navigation';
	import BackHeader from '$lib/components/BackHeader.svelte';
	import {
		formatSubscriptionDate,
		getSubscriptionResult,
		hasSubscriptionAccess,
		needsPaymentAttention,
		openBillingPortal,
		paymentMethodLabel,
		subscriptionStatusLabel,
		type SubscriptionState
	} from '$lib/billing';
	import { auth } from '$lib/stores/auth.svelte';

	let loading = $state(true);
	let subscription = $state<SubscriptionState | null>(null);
	let loadFailed = $state(false);
	let busy = $state(false);
	let actionError = $state<string | null>(null);
	let initialized = false;

	const hasAccess = $derived(subscription !== null && hasSubscriptionAccess(subscription.status));
	const locale = typeof navigator === 'undefined' ? 'en-NZ' : navigator.language;

	$effect(() => {
		if (!auth.checked || initialized) return;
		initialized = true;
		if (!auth.signedIn) {
			void goto('/login');
			return;
		}
		void loadSubscription();
	});

	async function loadSubscription() {
		loading = true;
		loadFailed = false;
		const result = await getSubscriptionResult();
		if (result.ok && result.subscription.status === 'none') {
			await goto('/pricing');
			return;
		}
		subscription = result.subscription;
		loadFailed = !result.ok;
		loading = false;
	}

	async function manageSubscription() {
		busy = true;
		actionError = null;
		try {
			const url = await openBillingPortal();
			if (url) window.location.href = url;
			else await goto('/pricing');
		} catch {
			actionError = "Couldn't open subscription management. Please try again.";
			busy = false;
		}
	}
</script>

<div class="account-screen screen">
	<BackHeader onBack={() => goto('/')} label="Account" />

	<main class="account-content">
		<header class="account-heading">
			<div class="eyebrow">Your account</div>
			<h1>Bloom Sync</h1>
			{#if auth.email}<p>{auth.email}</p>{/if}
		</header>

		{#if !auth.checked || loading}
			<div class="state-card" role="status">Checking your membership…</div>
		{:else if loadFailed}
			<div class="state-card error-card" role="alert">
				<strong>Membership details unavailable</strong>
				<span>We couldn't reach billing. Your local journal is still available.</span>
				<button class="text-button" type="button" onclick={loadSubscription}>Try again</button>
			</div>
		{:else if subscription}
			{#if needsPaymentAttention(subscription.status)}
				<div class="attention-card" role="alert">
					<strong>Update your payment method</strong>
					<span>Your last payment didn't go through. Update your card to keep Bloom Sync active.</span>
				</div>
			{/if}

			<section class="membership-card" aria-label="Bloom Sync membership">
				{@render SummaryRow('Status', subscriptionStatusLabel(subscription.status))}
				{#if subscription.cancelAtPeriodEnd}
					{@render SummaryRow(
						'Access until',
						formatSubscriptionDate(subscription.currentPeriodEnd, locale),
						'Your membership is set to cancel at the end of this period.'
					)}
				{:else if hasAccess}
					{@render SummaryRow(
						'Renews on',
						formatSubscriptionDate(subscription.currentPeriodEnd, locale)
					)}
				{/if}
				{@render SummaryRow('Payment method', paymentMethodLabel(subscription))}
			</section>

			{#if hasAccess}
				<button class="primary-action" type="button" onclick={manageSubscription} disabled={busy}>
					{busy ? 'Opening…' : 'Manage subscription'}
				</button>
			{:else}
				<a class="primary-action" href="/pricing">
					{subscription.status === 'canceled' ? 'Reactivate Bloom Sync' : 'Enable Bloom Sync'}
				</a>
			{/if}

			{#if actionError}<p class="action-error" role="alert">{actionError}</p>{/if}
		{/if}

		{#if auth.signedIn}
			<button class="sign-out" type="button" onclick={() => auth.signOut()}>Sign out</button>
			<p class="local-note">Signing out or canceling Sync never removes the journal saved on this device.</p>
		{/if}
	</main>
</div>

{#snippet SummaryRow(label: string, value: string, hint?: string)}
	<div class="summary-row">
		<span class="summary-label">{label}</span>
		<span class="summary-value">
			{value}
			{#if hint}<small>{hint}</small>{/if}
		</span>
	</div>
{/snippet}

<style>
	.account-screen {
		height: 100%;
		overflow-y: auto;
		background: var(--paper);
	}
	.account-content {
		width: min(100%, 620px);
		margin: 0 auto;
		padding: 30px 20px 48px;
	}
	.account-heading { margin-bottom: 26px; }
	.eyebrow {
		font-size: 10px;
		letter-spacing: 1.5px;
		text-transform: uppercase;
		color: var(--accent);
		font-weight: 600;
		margin-bottom: 7px;
	}
	h1 {
		font-family: var(--serif);
		font-style: italic;
		font-size: 36px;
		font-weight: 500;
		line-height: 1.05;
		color: var(--ink);
	}
	.account-heading p { margin-top: 8px; color: var(--ink-3); font-size: 13px; }
	.state-card,
	.attention-card,
	.membership-card {
		border: 1px solid var(--line-soft);
		border-radius: 14px;
		background: var(--card);
		padding: 18px;
	}
	.state-card { color: var(--ink-2); }
	.error-card,
	.attention-card { display: flex; flex-direction: column; gap: 6px; }
	.error-card span,
	.attention-card span { color: var(--ink-2); font-size: 13px; line-height: 1.45; }
	.attention-card { margin-bottom: 14px; border-color: var(--crema); background: var(--card-2); }
	.text-button {
		align-self: flex-start;
		margin-top: 7px;
		border: 0;
		background: none;
		padding: 0;
		color: var(--accent);
		font: inherit;
		font-weight: 600;
		cursor: pointer;
	}
	.membership-card { display: flex; flex-direction: column; gap: 17px; }
	.summary-row { display: flex; align-items: flex-start; justify-content: space-between; gap: 22px; }
	.summary-label { color: var(--ink-3); font-size: 13px; }
	.summary-value { color: var(--ink); font-size: 13px; font-weight: 600; text-align: right; }
	.summary-value small { display: block; max-width: 300px; margin-top: 4px; color: var(--ink-3); font-weight: 400; line-height: 1.4; }
	.primary-action {
		display: block;
		box-sizing: border-box;
		width: 100%;
		margin-top: 16px;
		padding: 12px 16px;
		border: 0;
		border-radius: 9px;
		background: var(--ink);
		color: var(--paper);
		font: inherit;
		font-size: 13px;
		font-weight: 600;
		text-align: center;
		cursor: pointer;
	}
	.primary-action:disabled { opacity: 0.65; cursor: wait; }
	.action-error { margin-top: 10px; color: #9f3a2d; font-size: 12px; text-align: center; }
	.sign-out {
		width: 100%;
		margin-top: 24px;
		padding: 11px 16px;
		border: 1px solid var(--line-soft);
		border-radius: 9px;
		background: transparent;
		color: var(--ink-2);
		font: inherit;
		font-size: 13px;
		font-weight: 600;
		cursor: pointer;
	}
	.local-note { margin: 11px auto 0; max-width: 430px; color: var(--ink-4); font-size: 11px; line-height: 1.45; text-align: center; }
	@media (min-width: 860px) {
		.account-content { padding-top: 38px; }
		h1 { font-size: 42px; }
	}
</style>
