import { getCsrfToken, invalidateCsrfToken } from '$lib/bff';

export type BeanExtraction = {
	name: string | null;
	roaster: string | null;
	origin: string | null;
	process: string | null;
	varietal: string | null;
	roast: 'light' | 'medium' | 'dark' | null;
	altitude: string | null;
	tasting: string[];
};

const ENDPOINT = '/api/ai/bean-extraction';

export class BeanExtractionHttpError extends Error {
	constructor(readonly status: number, readonly code: string) {
		super(code);
	}
}

function isExtraction(value: unknown): value is BeanExtraction {
	if (!value || typeof value !== 'object') return false;
	const result = value as Record<string, unknown>;
	const nullableStrings = ['name', 'roaster', 'origin', 'process', 'varietal', 'altitude'];
	return nullableStrings.every((key) => result[key] === null || typeof result[key] === 'string')
		&& (result.roast === null || ['light', 'medium', 'dark'].includes(String(result.roast)))
		&& Array.isArray(result.tasting)
		&& result.tasting.every((note) => typeof note === 'string');
}

export async function extractBeanDetails(image: Blob): Promise<BeanExtraction> {
	const response = await fetch(ENDPOINT, {
		method: 'POST',
		headers: {
			'content-type': image.type,
			'X-CSRF-TOKEN': await getCsrfToken()
		},
		body: image,
		credentials: 'include'
	});
	if (response.status === 400) invalidateCsrfToken();
	if (!response.ok) {
		let code = `http_${response.status}`;
		try {
			const body = await response.json() as { error?: string };
			if (body.error) code = body.error;
		} catch {
			// The API deliberately returns no model/provider details to the browser.
		}
		throw new BeanExtractionHttpError(response.status, code);
	}

	const result: unknown = await response.json();
	if (!isExtraction(result)) throw new Error('The extracted details were invalid.');
	return result;
}
