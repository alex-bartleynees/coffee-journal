import { getCsrfToken, invalidateCsrfToken } from '$lib/bff';

/**
 * Billing client + status model, mirroring dopamine-kick's `schemas/billing.ts`
 * and `server/billing.ts` (the backend is the same shared Payments.Gateway,
 * reached through this app's BFF which injects the `coffee-journal` productId).
 *
 * Access rule (mirror of the backend's): `trialing`, `active`, or `past_due`
 * (soft-grace) grant sync access. Anything unrecognised fails closed to `none`.
 */

export type SubscriptionStatus =
	| 'none'
	| 'trialing'
	| 'active'
	| 'past_due'
	| 'canceled'
	| 'incomplete'
	| 'incomplete_expired'
	| 'unpaid'
	| 'paused';

export type SubscriptionState = {
	status: SubscriptionStatus;
	priceId?: string | null;
	currentPeriodEnd?: string | null;
	cancelAtPeriodEnd: boolean;
	paymentMethodBrand?: string | null;
	paymentMethodLast4?: string | null;
};

export type SubscriptionResult =
	| { ok: true; subscription: SubscriptionState }
	| { ok: false; subscription: typeof NO_SUBSCRIPTION };

export const NO_SUBSCRIPTION: SubscriptionState = {
	status: 'none',
	priceId: null,
	currentPeriodEnd: null,
	cancelAtPeriodEnd: false,
	paymentMethodBrand: null,
	paymentMethodLast4: null
};

const ACCESS_STATUSES: ReadonlySet<SubscriptionStatus> = new Set([
	'trialing',
	'active',
	'past_due'
]);

const KNOWN_STATUSES: ReadonlySet<string> = new Set([
	'none', 'trialing', 'active', 'past_due', 'canceled',
	'incomplete', 'incomplete_expired', 'unpaid', 'paused'
]);

export function hasSubscriptionAccess(status: SubscriptionStatus): boolean {
	return ACCESS_STATUSES.has(status);
}

/** `past_due`/`incomplete` keep or may regain access but need a payment fix. */
export function needsPaymentAttention(status: SubscriptionStatus): boolean {
	return status === 'past_due' || status === 'incomplete';
}

const STATUS_LABELS: Record<SubscriptionStatus, string> = {
	none: 'No membership',
	trialing: 'Free trial',
	active: 'Active',
	past_due: 'Payment past due',
	canceled: 'Canceled',
	incomplete: 'Incomplete',
	incomplete_expired: 'Expired',
	unpaid: 'Unpaid',
	paused: 'Paused'
};

export function subscriptionStatusLabel(status: SubscriptionStatus): string {
	return STATUS_LABELS[status];
}

export function formatSubscriptionDate(
	value: string | null | undefined,
	locale?: string
): string {
	if (!value) return '—';
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return '—';
	return date.toLocaleDateString(locale, {
		year: 'numeric',
		month: 'long',
		day: 'numeric'
	});
}

export function paymentMethodLabel(subscription: SubscriptionState): string {
	return subscription.paymentMethodLast4
		? `${subscription.paymentMethodBrand ?? 'Card'} ···· ${subscription.paymentMethodLast4}`
		: 'None on file';
}

function parseState(data: unknown): SubscriptionState {
	const raw = data as Partial<SubscriptionState> | null;
	const status =
		raw && typeof raw.status === 'string' && KNOWN_STATUSES.has(raw.status)
			? (raw.status as SubscriptionStatus)
			: 'none';
	return {
		status,
		priceId: raw?.priceId ?? null,
		currentPeriodEnd: raw?.currentPeriodEnd ?? null,
		cancelAtPeriodEnd: raw?.cancelAtPeriodEnd ?? false,
		paymentMethodBrand: raw?.paymentMethodBrand ?? null,
		paymentMethodLast4: raw?.paymentMethodLast4 ?? null
	};
}

/**
 * Read the caller's subscription state. Always resolves — a brand-new user gets
 * `none`, and any backend/network failure fails closed to `none` so callers
 * route to pricing rather than crash.
 */
export async function getSubscriptionResult(): Promise<SubscriptionResult> {
	try {
		const res = await fetch('/api/billing/subscription', { credentials: 'include' });
		if (res.ok) return { ok: true, subscription: parseState(await res.json()) };
	} catch {
		return { ok: false, subscription: NO_SUBSCRIPTION };
	}
	return { ok: false, subscription: NO_SUBSCRIPTION };
}

export async function getSubscription(): Promise<SubscriptionState> {
	return (await getSubscriptionResult()).subscription;
}

async function billingPost(path: string): Promise<Response> {
	const res = await fetch(path, {
		method: 'POST',
		credentials: 'include',
		headers: { 'content-type': 'application/json', 'X-CSRF-TOKEN': await getCsrfToken() }
	});
	if (res.status === 400) invalidateCsrfToken();
	return res;
}

/**
 * Start a Stripe Checkout session (creates the Stripe customer on first call)
 * and return its hosted URL — redirect the browser there.
 */
export async function startCheckout(): Promise<string> {
	const res = await billingPost('/api/billing/checkout');
	if (res.ok) {
		const { url } = (await res.json()) as { url: string };
		return url;
	}
	throw new Error('Failed to start checkout');
}

/**
 * Open the Stripe Billing Portal (manage / cancel / update card). Returns null
 * when the user has no Stripe customer yet (404) — route to pricing instead.
 */
export async function openBillingPortal(): Promise<string | null> {
	const res = await billingPost('/api/billing/portal');
	if (res.ok) {
		const { url } = (await res.json()) as { url: string };
		return url;
	}
	if (res.status === 404) return null;
	throw new Error('Failed to open billing portal');
}

/**
 * Force an immediate re-sync of subscription state from Stripe — called by the
 * /success page to close the race with Stripe's webhook. Returns false when
 * there's no Stripe customer (404).
 */
export async function syncSubscription(): Promise<boolean> {
	const res = await billingPost('/api/billing/sync');
	if (res.ok) return true;
	if (res.status === 404) return false;
	throw new Error('Failed to sync subscription');
}
