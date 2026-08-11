import { afterEach, describe, expect, it, vi } from 'vitest';
import {
	formatSubscriptionDate,
	getSubscriptionResult,
	paymentMethodLabel,
	subscriptionStatusLabel,
	type SubscriptionState
} from './billing';

const subscription = (overrides: Partial<SubscriptionState> = {}): SubscriptionState => ({
	status: 'active',
	cancelAtPeriodEnd: false,
	...overrides
});

describe('billing presentation', () => {
	afterEach(() => vi.unstubAllGlobals());

	it.each([
		['none', 'No membership'],
		['trialing', 'Free trial'],
		['active', 'Active'],
		['past_due', 'Payment past due'],
		['canceled', 'Canceled'],
		['incomplete', 'Incomplete'],
		['incomplete_expired', 'Expired'],
		['unpaid', 'Unpaid'],
		['paused', 'Paused']
	] as const)('labels %s as %s', (status, label) => {
		expect(subscriptionStatusLabel(status)).toBe(label);
	});

	it('formats valid dates and safely handles absent or invalid values', () => {
		expect(formatSubscriptionDate('2026-08-31T00:00:00Z', 'en-NZ')).toBe('31 August 2026');
		expect(formatSubscriptionDate(null, 'en-NZ')).toBe('—');
		expect(formatSubscriptionDate('not-a-date', 'en-NZ')).toBe('—');
	});

	it('shows a masked payment method without inventing missing details', () => {
		expect(paymentMethodLabel(subscription({ paymentMethodBrand: 'visa', paymentMethodLast4: '4242' }))).toBe(
			'visa ···· 4242'
		);
		expect(paymentMethodLabel(subscription())).toBe('None on file');
	});

	it('distinguishes a billing outage from a genuine no-membership response', async () => {
		vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
		expect(await getSubscriptionResult()).toEqual({
			ok: false,
			subscription: expect.objectContaining({ status: 'none' })
		});

		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue({ ok: true, json: async () => ({ status: 'none' }) })
		);
		expect(await getSubscriptionResult()).toEqual({
			ok: true,
			subscription: expect.objectContaining({ status: 'none' })
		});
	});
});
