import { describe, expect, it } from 'vitest';
import type { Brew } from '$lib/data/types';
import { createDraft, draftFromBrew } from './DraftBrew';

describe('milk drink draft state', () => {
	it('starts without a milk drink', () => {
		const draft = createDraft('bean-1');

		expect(draft.withMilk).toBe(false);
		expect(draft.milkDrink).toBeNull();
	});

	it('restores the recorded milk drink', () => {
		const draft = draftFromBrew({ withMilk: true, milkDrink: 'Cortado' } as Brew);

		expect(draft.withMilk).toBe(true);
		expect(draft.milkDrink).toBe('Cortado');
	});

	it('treats older milk brews as flat whites', () => {
		const draft = draftFromBrew({ withMilk: true } as Brew);

		expect(draft.milkDrink).toBe('Flat White');
	});
});
