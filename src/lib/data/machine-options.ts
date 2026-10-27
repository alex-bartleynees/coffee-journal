import type { Machine, MachineBrewOption, MachineSetting } from './types';

/** Decimal places implied by an option's step, so 0.5 steps show one decimal. */
export function stepDecimals(step: number): number {
	const [, fraction = ''] = String(step).split('.');
	return Math.min(fraction.length, 3);
}

export function clampOptionValue(option: MachineBrewOption, value: number): number {
	const clamped = Math.min(option.max, Math.max(option.min, value));
	return +clamped.toFixed(stepDecimals(option.step));
}

/** The draft's value for an option, falling back to the option's default. */
export function optionValue(option: MachineBrewOption, values: Record<string, number>): number {
	const value = values[option.id];
	return clampOptionValue(option, typeof value === 'number' && Number.isFinite(value) ? value : option.default);
}

/** Snapshot of every option on the brew's machine, as stored on the brew. */
export function machineSettingsSnapshot(
	machine: Machine | undefined,
	values: Record<string, number>
): MachineSetting[] {
	return (machine?.brewOptions ?? []).map((option) => {
		const setting: MachineSetting = { optionId: option.id, label: option.label, value: optionValue(option, values) };
		if (option.unit) setting.unit = option.unit;
		return setting;
	});
}

export function settingValues(settings: MachineSetting[] | undefined): Record<string, number> {
	return Object.fromEntries((settings ?? []).map((setting) => [setting.optionId, setting.value]));
}

export function formatSetting(setting: Pick<MachineSetting, 'value' | 'unit'>): string {
	return setting.unit ? `${setting.value}${setting.unit === '%' ? '' : ' '}${setting.unit}` : String(setting.value);
}

function isFiniteNumber(value: unknown): value is number {
	return typeof value === 'number' && Number.isFinite(value);
}

/** Validates stored/synced JSON, dropping malformed options rather than failing the row. */
export function parseBrewOptions(raw: string | null | undefined): MachineBrewOption[] {
	if (!raw) return [];
	try {
		const parsed: unknown = JSON.parse(raw);
		if (!Array.isArray(parsed)) return [];
		return parsed.filter((option): option is MachineBrewOption => {
			if (typeof option !== 'object' || option === null) return false;
			const o = option as Record<string, unknown>;
			return (
				typeof o.id === 'string' && typeof o.label === 'string' &&
				(o.unit === undefined || typeof o.unit === 'string') &&
				isFiniteNumber(o.min) && isFiniteNumber(o.max) && isFiniteNumber(o.step) && o.step > 0 &&
				o.min <= o.max && isFiniteNumber(o.default)
			);
		});
	} catch {
		return [];
	}
}

export function parseMachineSettings(raw: string | null | undefined): MachineSetting[] {
	if (!raw) return [];
	try {
		const parsed: unknown = JSON.parse(raw);
		if (!Array.isArray(parsed)) return [];
		return parsed.filter((setting): setting is MachineSetting => {
			if (typeof setting !== 'object' || setting === null) return false;
			const s = setting as Record<string, unknown>;
			return (
				typeof s.optionId === 'string' && typeof s.label === 'string' &&
				(s.unit === undefined || typeof s.unit === 'string') && isFiniteNumber(s.value)
			);
		});
	} catch {
		return [];
	}
}

/** Quick-add templates on the machine form; anything else is a custom option. */
export const BREW_OPTION_PRESETS: readonly Omit<MachineBrewOption, 'id'>[] = [
	{ label: 'Pre-infusion time', unit: 's', min: 0, max: 15, step: 1, default: 7 },
	{ label: 'Pre-infusion power', unit: '%', min: 55, max: 99, step: 1, default: 60 }
];

/** Whether an option being edited on the machine form can be saved. */
export function isValidBrewOption(option: MachineBrewOption): boolean {
	const numbers = [option.min, option.max, option.step, option.default];
	return (
		option.label.trim().length > 0 &&
		numbers.every((n) => typeof n === 'number' && Number.isFinite(n)) &&
		option.step > 0 && option.min <= option.max
	);
}

/** Trims text and pulls the default into range before the option is saved. */
export function normalizeBrewOption(option: MachineBrewOption): MachineBrewOption {
	const normalized: MachineBrewOption = { ...option, label: option.label.trim(), unit: option.unit?.trim() || undefined };
	if (!normalized.unit) delete normalized.unit;
	normalized.default = clampOptionValue(normalized, normalized.default);
	return normalized;
}
