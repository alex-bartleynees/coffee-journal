export type CreateUserInput = {
	name: string;
	email: string;
	password: string;
};

export type CreateUserResult = 'created' | 'account_may_exist' | 'too_many_requests' | 'failed';

export async function createUser(input: CreateUserInput): Promise<CreateUserResult> {
	try {
		const response = await fetch('/api/users', {
			method: 'POST',
			credentials: 'include',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify(input)
		});
		if (response.status === 201) return 'created';
		if (response.status === 409) return 'account_may_exist';
		if (response.status === 429) return 'too_many_requests';
		return 'failed';
	} catch {
		return 'failed';
	}
}
