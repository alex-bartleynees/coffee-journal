<script lang="ts">
	import { onMount } from 'svelte';
	import Icon from '$lib/icons/Icon.svelte';
	import { auth } from '$lib/stores/auth.svelte';
	import {
		getSubscription,
		hasSubscriptionAccess,
		openBillingPortal,
		startCheckout,
		type SubscriptionState
	} from '$lib/billing';

	const PERKS = [
		'Sync across all your devices — phone, laptop, anywhere',
		'Your journal safely backed up, never just on one device',
		'Sign in on a new device and your brews are already there',
		'Every future feature, included'
	];

	let loading = $state(true);
	let subscription = $state<SubscriptionState | null>(null);
	let busy = $state(false);
	let errorMsg = $state<string | null>(null);

	const hasAccess = $derived(subscription != null && hasSubscriptionAccess(subscription.status));

	onMount(async () => {
		subscription = await getSubscription();
		loading = false;
	});

	async function checkout() {
		busy = true;
		errorMsg = null;
		try {
			// Hand the browser to Stripe's hosted checkout.
			window.location.href = await startCheckout();
		} catch {
			errorMsg = "Couldn't start checkout. Please try again.";
			busy = false;
		}
	}

	async function portal() {
		busy = true;
		errorMsg = null;
		try {
			const url = await openBillingPortal();
			if (url) window.location.href = url;
			else busy = false;
		} catch {
			errorMsg = "Couldn't open the billing portal. Please try again.";
			busy = false;
		}
	}
</script>

<div class="pricing-screen">
	<div class="bloom-swirl" aria-hidden="true">
		<div class="ring ring-1"></div>
		<div class="ring ring-2"></div>
		<div class="ring ring-3"></div>
	</div>

	<div class="pricing-content">
		<a class="brand" href="/">
			<div class="brand-mark">c</div>
			<div>
				<div class="brand-name">Bloom</div>
				<div class="brand-sub">Coffee Journal</div>
			</div>
		</a>

		{#if !auth.signedIn}
			<div class="hero">
				<div class="eyebrow">Bloom Sync</div>
				<h1>One journal,<br /><span class="accent-text">every device.</span></h1>
				<p>Sign in first — then unlock sync to carry your brews everywhere.</p>
			</div>
			<a class="btn btn-primary cta" href="/login">Sign in <span class="arrow">→</span></a>
			<a class="skip" href="/">Skip — keep using it locally</a>
		{:else if loading}
			<div class="hero">
				<div class="eyebrow">Bloom Sync</div>
				<h1>Checking your<br /><span class="accent-text">membership…</span></h1>
			</div>
		{:else if hasAccess}
			<div class="hero">
				<div class="eyebrow">Bloom Sync</div>
				<h1>You're<br /><span class="accent-text">all set.</span></h1>
				<p>Your membership is active — your journal syncs everywhere you sign in.</p>
			</div>
			<a class="btn btn-accent cta" href="/">
				<Icon name="check" size={16} /> Back to your journal
			</a>
			<button type="button" class="skip" onclick={portal} disabled={busy}>
				{busy ? 'Opening…' : 'Manage subscription'}
			</button>
		{:else}
			<div class="hero">
				<div class="eyebrow">Bloom Sync</div>
				<h1>One journal,<br /><span class="accent-text">every device.</span></h1>
				<p>Your journal is free on this device, forever. Sync it everywhere with Bloom Sync — cancel anytime.</p>
			</div>

			<ul class="perks">
				{#each PERKS as perk (perk)}
					<li>
						<span class="perk-check"><Icon name="check" size={12} strokeWidth={2.5} /></span>
						<span>{perk}</span>
					</li>
				{/each}
			</ul>

			<button type="button" class="btn btn-accent cta" onclick={checkout} disabled={busy}>
				{busy ? 'Starting checkout…' : 'Start free trial'}
				{#if !busy}<span class="arrow">→</span>{/if}
			</button>
			<p class="fine-print">You'll be redirected to Stripe to complete signup securely.</p>
			{#if errorMsg}<p class="error-msg" role="alert">{errorMsg}</p>{/if}
			<a class="skip" href="/">Not now — keep it local</a>
		{/if}
	</div>
</div>

<style>
	.pricing-screen {
		height: 100%;
		display: flex;
		flex-direction: column;
		position: relative;
		overflow-y: auto;
		background: var(--paper);
	}
	.bloom-swirl {
		position: absolute;
		top: -120px;
		right: -90px;
		width: 280px;
		height: 280px;
		opacity: 0.5;
		pointer-events: none;
	}
	.ring {
		position: absolute;
		inset: 0;
		border-radius: 50%;
		border: 1.5px solid var(--crema);
	}
	.ring-2 {
		inset: 34px;
		border-color: var(--accent);
		opacity: 0.5;
	}
	.ring-3 {
		inset: 72px;
		border-color: var(--ink-3);
		opacity: 0.35;
	}
	.pricing-content {
		flex: 1;
		display: flex;
		flex-direction: column;
		justify-content: center;
		padding: 48px 28px calc(28px + env(safe-area-inset-bottom, 12px));
		max-width: 430px;
		width: 100%;
		margin: 0 auto;
		position: relative;
	}
	.brand {
		display: flex;
		align-items: center;
		gap: 10px;
		margin-bottom: 34px;
	}
	.brand-mark {
		width: 38px;
		height: 38px;
		border-radius: 12px;
		background: var(--ink);
		color: var(--paper);
		font-family: var(--serif);
		font-style: italic;
		font-size: 22px;
		display: flex;
		align-items: center;
		justify-content: center;
		padding-bottom: 4px;
	}
	.brand-name {
		font-family: var(--serif);
		font-size: 17px;
		font-weight: 600;
		letter-spacing: -0.3px;
		color: var(--ink);
		line-height: 1.1;
	}
	.brand-sub {
		font-size: 10.5px;
		letter-spacing: 1.6px;
		text-transform: uppercase;
		color: var(--ink-3);
	}
	.eyebrow {
		font-size: 11px;
		letter-spacing: 2px;
		text-transform: uppercase;
		color: var(--accent);
		font-weight: 600;
		margin-bottom: 10px;
	}
	.hero h1 {
		font-family: var(--serif);
		font-size: 36px;
		font-weight: 400;
		font-style: italic;
		line-height: 1.08;
		letter-spacing: -0.8px;
		margin: 0 0 12px;
		color: var(--ink);
		font-variation-settings: 'opsz' 144, 'SOFT' 50;
	}
	.accent-text {
		color: var(--accent);
	}
	.hero p {
		font-size: 14.5px;
		line-height: 1.55;
		color: var(--ink-2);
		margin: 0 0 24px;
		max-width: 320px;
	}
	.perks {
		list-style: none;
		margin: 0 0 26px;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 12px;
	}
	.perks li {
		display: flex;
		align-items: flex-start;
		gap: 10px;
		font-size: 14px;
		line-height: 1.45;
		color: var(--ink-2);
	}
	.perk-check {
		flex: none;
		width: 20px;
		height: 20px;
		margin-top: 1px;
		border-radius: 50%;
		background: var(--card-2);
		border: 1px solid var(--line);
		color: var(--accent);
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.cta {
		width: 100%;
		justify-content: center;
	}
	.cta[disabled] {
		opacity: 0.6;
	}
	.arrow {
		margin-left: 6px;
	}
	.fine-print {
		font-size: 12px;
		color: var(--ink-3);
		text-align: center;
		margin: 12px 0 0;
	}
	.error-msg {
		font-size: 13px;
		color: #b3402a;
		text-align: center;
		margin: 10px 0 0;
	}
	.skip {
		display: block;
		width: 100%;
		text-align: center;
		margin-top: 18px;
		font-size: 13.5px;
		color: var(--ink-3);
		text-decoration: underline;
		text-underline-offset: 3px;
		background: none;
		border: none;
		cursor: pointer;
	}
</style>
