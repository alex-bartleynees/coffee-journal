import { describe, expect, it, vi } from 'vitest';
import { extractionImage } from './extraction-image';

describe('extraction image resolution', () => {
	it('uses the in-memory pending photo without loading storage', async () => {
		const pending = new Blob(['new'], { type: 'image/webp' });
		const loadStored = vi.fn();

		expect(await extractionImage(pending, 'bean-1', loadStored)).toBe(pending);
		expect(loadStored).not.toHaveBeenCalled();
	});

	it('loads an existing photo from local storage instead of fetching its blob URL', async () => {
		const stored = new Blob(['stored'], { type: 'image/webp' });
		const loadStored = vi.fn().mockResolvedValue(stored);

		expect(await extractionImage(null, 'bean-1', loadStored)).toBe(stored);
		expect(loadStored).toHaveBeenCalledExactlyOnceWith('bean-1');
	});
});
