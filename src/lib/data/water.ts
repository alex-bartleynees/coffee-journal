import { brewEquipment } from './brew-equipment';
import { clampOptionValue, hasValidRange, optionValue } from './machine-options';
import type { Brew, MineralAddition, MineralDose, MineralStage, WaterProfile } from './types';

export const MINERAL_STAGES: readonly { value: MineralStage; label: string }[] = [
	{ value: 'brew-water', label: 'Brew water' },
	{ value: 'in-cup', label: 'In cup' }
];

export function stageLabel(stage: MineralStage): string {
	return stage === 'in-cup' ? 'in cup' : 'in brew water';
}

/** Snapshot of every addition on the brew's water profile, as stored on the brew. */
export function mineralDosesSnapshot(
	profile: WaterProfile | undefined,
	values: Record<string, number>
): MineralDose[] {
	return (profile?.additions ?? []).map((addition) => {
		const dose: MineralDose = {
			additionId: addition.id,
			product: addition.product,
			stage: addition.stage,
			amount: optionValue(addition, values)
		};
		if (addition.unit) dose.unit = addition.unit;
		return dose;
	});
}

export function doseValues(doses: MineralDose[] | undefined): Record<string, number> {
	return Object.fromEntries((doses ?? []).map((dose) => [dose.additionId, dose.amount]));
}

/** "3 drops", "1.5 ml", or a bare number when the addition has no unit. */
export function formatDose(dose: Pick<MineralDose, 'amount' | 'unit'>): string {
	return dose.unit ? `${dose.amount} ${dose.unit}` : String(dose.amount);
}

/**
 * Water for a new brew: the most recent brew's profile (if it's still offered),
 * with that brew's amounts — water rarely changes between brews.
 */
export function lastWaterChoice(
	brews: Brew[],
	profiles: WaterProfile[]
): { waterProfile: string | null; mineralDoses: Record<string, number> } {
	const available = brewEquipment(profiles);
	const last = brews.find((brew) => brew.waterProfile && available.some((p) => p.id === brew.waterProfile));
	if (!last?.waterProfile) return { waterProfile: null, mineralDoses: {} };
	return { waterProfile: last.waterProfile, mineralDoses: doseValues(last.mineralDoses) };
}

function isFiniteNumber(value: unknown): value is number {
	return typeof value === 'number' && Number.isFinite(value);
}

function isStage(value: unknown): value is MineralStage {
	return value === 'brew-water' || value === 'in-cup';
}

/** Validates stored/synced JSON, dropping malformed additions rather than failing the row. */
export function parseMineralAdditions(raw: string | null | undefined): MineralAddition[] {
	if (!raw) return [];
	try {
		const parsed: unknown = JSON.parse(raw);
		if (!Array.isArray(parsed)) return [];
		return parsed.filter((addition): addition is MineralAddition => {
			if (typeof addition !== 'object' || addition === null) return false;
			const a = addition as Record<string, unknown>;
			return (
				typeof a.id === 'string' && typeof a.product === 'string' &&
				(a.unit === undefined || typeof a.unit === 'string') && isStage(a.stage) &&
				isFiniteNumber(a.min) && isFiniteNumber(a.max) && isFiniteNumber(a.step) && a.step > 0 &&
				a.min <= a.max && isFiniteNumber(a.default)
			);
		});
	} catch {
		return [];
	}
}

export function parseMineralDoses(raw: string | null | undefined): MineralDose[] {
	if (!raw) return [];
	try {
		const parsed: unknown = JSON.parse(raw);
		if (!Array.isArray(parsed)) return [];
		return parsed.filter((dose): dose is MineralDose => {
			if (typeof dose !== 'object' || dose === null) return false;
			const d = dose as Record<string, unknown>;
			return (
				typeof d.additionId === 'string' && typeof d.product === 'string' &&
				(d.unit === undefined || typeof d.unit === 'string') && isStage(d.stage) && isFiniteNumber(d.amount)
			);
		});
	} catch {
		return [];
	}
}

/** Quick-add templates on the water form; anything else is a custom addition. */
export const MINERAL_ADDITION_PRESETS: readonly { label: string; addition: Omit<MineralAddition, 'id'> }[] = [
	{ label: 'Drops in cup', addition: { product: '', unit: 'drops', stage: 'in-cup', min: 0, max: 10, step: 1, default: 2 } },
	{ label: 'Drops in brew water', addition: { product: '', unit: 'drops', stage: 'brew-water', min: 0, max: 30, step: 1, default: 5 } },
	{ label: 'Concentrate (ml)', addition: { product: '', unit: 'ml', stage: 'brew-water', min: 0, max: 20, step: 0.5, default: 1 } }
];

/** Whether an addition being edited on the water form can be saved. */
export function isValidMineralAddition(addition: MineralAddition): boolean {
	return addition.product.trim().length > 0 && hasValidRange(addition);
}

/** Trims text and pulls the default into range before the addition is saved. */
export function normalizeMineralAddition(addition: MineralAddition): MineralAddition {
	const normalized: MineralAddition = { ...addition, product: addition.product.trim(), unit: addition.unit?.trim() || undefined };
	if (!normalized.unit) delete normalized.unit;
	normalized.default = clampOptionValue(normalized, normalized.default);
	return normalized;
}

/** "GH 50 · KH 40 · TDS 120 ppm" from whichever measurements were recorded. */
export function waterMeasurements(profile: Pick<WaterProfile, 'gh' | 'kh' | 'tds'>): string | undefined {
	const parts = [
		profile.gh != null ? `GH ${profile.gh}` : null,
		profile.kh != null ? `KH ${profile.kh}` : null,
		profile.tds != null ? `TDS ${profile.tds}` : null
	].filter(Boolean);
	return parts.length ? `${parts.join(' · ')} ppm` : undefined;
}
