import { describe, expect, it } from 'vitest';
import type { Brew } from '$lib/data/types';
import { calendarDate } from '$lib/data/date';
import { brewFromDraft, brewSteps, createDraft, draftFromBrew } from './DraftBrew';

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

describe('quick brew draft state', () => {
	it('uses two steps only when quick brew is enabled', () => {
		expect(brewSteps(false).map((step) => step.key)).toEqual(['bean', 'brew', 'taste', 'verdict']);
		expect(brewSteps(true).map((step) => step.key)).toEqual(['bean', 'brew']);
	});

	it('restores an unrated brew in quick mode with a usable verdict default', () => {
		const draft = draftFromBrew({ rating: null, withMilk: false, descriptors: [] } as unknown as Brew);

		expect(draft.quickBrew).toBe(true);
		expect(draft.rating).toBe(7);
	});

	it('saves quick brews without hidden tasting or verdict values', () => {
		const draft = createDraft('bean-1');
		Object.assign(draft, {
			quickBrew: true,
			aroma: 'Floral',
			descriptors: ['Berry'],
			rating: 9,
			rating2: 8,
			buyAgain: 'Yes' as const
		});

		const brew = brewFromDraft(draft, { id: 'brew-1', date: calendarDate('2026-08-18'), time: '08:00' });

		expect(brew.rating).toBeNull();
		expect(brew.rating2).toBeNull();
		expect(brew.aroma).toBeUndefined();
		expect(brew.descriptors).toEqual([]);
		expect(brew.buyAgain).toBeNull();
		expect('quickBrew' in brew).toBe(false);
	});
});

describe('brew measurement precision', () => {
	it('normalizes floating-point noise before saving', () => {
		const draft = createDraft('bean-1');
		Object.assign(draft, {
			doseIn: 18.200000000000003,
			yieldOut: 38.099999999999994,
			grindSetting: 2.0999999999999996,
			temperature: 92.50000000000001
		});

		const brew = brewFromDraft(draft, { id: 'brew-1', date: calendarDate('2026-08-19'), time: '08:00' });

		expect(brew).toMatchObject({ doseIn: 18.2, yieldOut: 38.1, grindSetting: 2.1, temperature: 92.5 });
	});
});
