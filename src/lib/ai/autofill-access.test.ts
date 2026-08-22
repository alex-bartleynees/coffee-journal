import { describe, expect, it } from 'vitest';
import { aiAutofillAccess } from './autofill-access';

describe('AI autofill access', () => {
	it('fails closed until authentication and a paid subscription are confirmed', () => {
		expect(aiAutofillAccess(false, false, null)).toBe('checking');
		expect(aiAutofillAccess(true, false, null)).toBe('sign-in-required');
		expect(aiAutofillAccess(true, true, null)).toBe('checking');
		expect(aiAutofillAccess(true, true, 'none')).toBe('subscription-required');
		expect(aiAutofillAccess(true, true, 'canceled')).toBe('subscription-required');
		expect(aiAutofillAccess(true, true, 'active')).toBe('available');
		expect(aiAutofillAccess(true, true, 'trialing')).toBe('available');
		expect(aiAutofillAccess(true, true, 'past_due')).toBe('available');
	});
});
