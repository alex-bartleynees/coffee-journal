/** Formats measurements without exposing binary floating-point noise. */
export function formatDecimal(value: number, maximumDecimals = 2): string {
	if (!Number.isFinite(value)) return '—';
	const rounded = Number(value.toFixed(maximumDecimals));
	return Object.is(rounded, -0) ? '0' : String(rounded);
}

export function roundDecimal(value: number, maximumDecimals = 2): number {
	return Number.isFinite(value) ? Number(value.toFixed(maximumDecimals)) : value;
}

/** Normalizes the numeric half of a persisted ratio while preserving its prefix. */
export function formatRatio(ratio: string, maximumDecimals = 2): string {
	const separator = ratio.indexOf(':');
	if (separator < 0) return ratio;

	const value = Number(ratio.slice(separator + 1));
	return Number.isFinite(value)
		? `${ratio.slice(0, separator + 1)}${formatDecimal(value, maximumDecimals)}`
		: ratio;
}
