import { describe, expect, it } from 'vitest';
import type { Brew } from './types';
import { averageRating, bestRating, ratedBrews, ratingLabel } from './ratings';

const brew = (rating: number | null) => ({ rating } as Brew);

describe('brew ratings', () => {
	it('excludes quick brews from rating aggregates', () => {
		const brews = [brew(8), brew(null), brew(6)];

		expect(ratedBrews(brews)).toHaveLength(2);
		expect(averageRating(brews)).toBe(7);
		expect(bestRating(brews)).toBe(8);
	});

	it('returns no aggregate when every brew is unrated', () => {
		expect(averageRating([brew(null)])).toBeNull();
		expect(bestRating([brew(null)])).toBeNull();
	});

	it('formats rated and unrated values deliberately', () => {
		expect(ratingLabel(null)).toBe('Not rated');
		expect(ratingLabel(7.5)).toBe('7.5/10');
	});
});
