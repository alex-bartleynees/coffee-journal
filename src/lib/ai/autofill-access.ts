import { hasSubscriptionAccess, type SubscriptionStatus } from '$lib/billing';

export type AiAutofillAccess =
	| 'checking'
	| 'sign-in-required'
	| 'subscription-required'
	| 'available';

/** Client-side UX gate. The API remains the security boundary; unknown client
 * state deliberately fails closed so a click cannot generate a request. */
export function aiAutofillAccess(
	authChecked: boolean,
	signedIn: boolean,
	status: SubscriptionStatus | null
): AiAutofillAccess {
	if (!authChecked) return 'checking';
	if (!signedIn) return 'sign-in-required';
	if (status === null) return 'checking';
	return hasSubscriptionAccess(status) ? 'available' : 'subscription-required';
}
