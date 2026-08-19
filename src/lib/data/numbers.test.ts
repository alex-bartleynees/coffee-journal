import { describe, expect, it } from 'vitest';
import { formatDecimal, formatExtractionTime, formatRatio } from './numbers';

describe('decimal display formatting', () => {
	it('hides floating-point noise without adding unnecessary zeroes', () => {
		expect(formatDecimal(2.0999999999999996)).toBe('2.1');
		expect(formatDecimal(18)).toBe('18');
		expect(formatDecimal(18.25)).toBe('18.25');
	});

	it('normalizes ratios already stored with floating-point noise', () => {
		expect(formatRatio('1:2.0999999999999996')).toBe('1:2.1');
		expect(formatRatio('—')).toBe('—');
	});
});

describe('extraction time formatting', () => {
	it('rounds fractional seconds without exposing floating-point noise', () => {
		expect(formatExtractionTime(122.09999999999998)).toBe('2:02');
	});

	it('carries rounded seconds into the next minute', () => {
		expect(formatExtractionTime(119.9)).toBe('2:00');
	});
});
