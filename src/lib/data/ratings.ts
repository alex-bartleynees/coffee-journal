import type { Brew } from './types';

export function ratedBrews(brews: readonly Brew[]): Brew[] {
	return brews.filter((brew) => brew.rating != null);
}

export function averageRating(brews: readonly Brew[]): number | null {
	const ratings = brews.flatMap((brew) => (brew.rating == null ? [] : [brew.rating]));
	return ratings.length ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length : null;
}

export function bestRating(brews: readonly Brew[]): number | null {
	const ratings = brews.flatMap((brew) => (brew.rating == null ? [] : [brew.rating]));
	return ratings.length ? Math.max(...ratings) : null;
}

export function ratingLabel(rating: number | null): string {
	return rating == null ? 'Not rated' : `${rating}/10`;
}
