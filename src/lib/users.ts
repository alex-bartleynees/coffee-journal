export type CreateUserInput = {
	name: string;
	email: string;
	password: string;
};

export type CreateUserResult = 'created' | 'too_many_requests' | 'failed';

export async function createUser(input: CreateUserInput): Promise<CreateUserResult> {
	try {
		const response = await fetch('/api/users', {
			method: 'POST',
			credentials: 'include',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify(input)
		});
		if (response.status === 201) return 'created';
		if (response.status === 429) return 'too_many_requests';
		return 'failed';
	} catch {
		return 'failed';
	}
}

/** Register the authenticated Keycloak identity as a Bloom user. This does not
 * grant sync access; the API's entitlement gate remains authoritative. */
export async function registerCurrentUser(csrfToken: string): Promise<boolean> {
	try {
		const response = await fetch('/api/users/me', {
			method: 'POST',
			credentials: 'include',
			headers: { 'X-CSRF-TOKEN': csrfToken }
		});
		return response.ok;
	} catch {
		return false;
	}
}
