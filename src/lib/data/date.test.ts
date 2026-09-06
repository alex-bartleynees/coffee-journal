import { describe, expect, it } from 'vitest';
import { calendarDate, isInWeek } from './date';

describe('calendar week', () => {
	it('includes only dates in the Monday-to-Sunday week containing the reference date', () => {
		const today = calendarDate('2026-09-06'); // Sunday

		expect(isInWeek(calendarDate('2026-08-30'), today)).toBe(false);
		expect(isInWeek(calendarDate('2026-08-31'), today)).toBe(true);
		expect(isInWeek(calendarDate('2026-09-06'), today)).toBe(true);
		expect(isInWeek(calendarDate('2026-09-07'), today)).toBe(false);
	});
});
