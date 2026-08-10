/**
 * Date helpers for the app's plain `YYYY-MM-DD` date strings (brew date, bean
 * dateOpened/roastDate, etc).
 *
 * `new Date('YYYY-MM-DD')` parses the string as UTC midnight, not local midnight.
 * Diffing that against `new Date()` (local "now") silently shifts by a day for
 * roughly half of each day in any timezone ahead of UTC (e.g. NZ) — a brew
 * logged at 8am NZT can parse as "yesterday". These helpers work entirely in
 * local calendar-date terms so stored dates and "today" never disagree.
 */

declare const calendarDateBrand: unique symbol;

/** A validated local calendar date in canonical YYYY-MM-DD form. */
export type CalendarDate = string & { readonly [calendarDateBrand]: true };

/** Validate an external string and promote it to a CalendarDate. */
export function calendarDate(value: string): CalendarDate {
	const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
	if (!match) throw new RangeError(`Invalid calendar date: ${value}`);

	const [, year, month, day] = match;
	const date = new Date(Number(year), Number(month) - 1, Number(day));
	if (
		date.getFullYear() !== Number(year) ||
		date.getMonth() !== Number(month) - 1 ||
		date.getDate() !== Number(day)
	) {
		throw new RangeError(`Invalid calendar date: ${value}`);
	}

	return value as CalendarDate;
}

/** Today's date as YYYY-MM-DD in the local timezone. */
export function todayIso(): CalendarDate {
	return dateToIso(new Date());
}

export function dateToIso(d: Date): CalendarDate {
	const y = d.getFullYear();
	const m = String(d.getMonth() + 1).padStart(2, '0');
	const day = String(d.getDate()).padStart(2, '0');
	return calendarDate(`${y}-${m}-${day}`);
}

/** Parse a YYYY-MM-DD string as local midnight (not UTC) — safe for display. */
export function parseIsoDate(iso: CalendarDate): Date {
	const [y, m, d] = iso.split('-').map(Number);
	return new Date(y, m - 1, d);
}

/** Whole-day difference (a − b) between two YYYY-MM-DD strings. DST-safe: both
 * sides are converted to UTC-at-midnight before subtracting, which cancels out
 * the local offset instead of letting a DST transition skew the day count. */
export function daysBetween(a: CalendarDate, b: CalendarDate): number {
	const [ay, am, ad] = a.split('-').map(Number);
	const [by, bm, bd] = b.split('-').map(Number);
	return Math.round((Date.UTC(ay, am - 1, ad) - Date.UTC(by, bm - 1, bd)) / 86400000);
}
