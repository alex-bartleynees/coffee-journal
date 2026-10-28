import { describe, expect, it } from 'vitest';
import type { Brew, MineralAddition, WaterProfile } from './types';
import {
	formatDose,
	isValidMineralAddition,
	lastWaterChoice,
	mineralDosesSnapshot,
	normalizeMineralAddition,
	parseMineralAdditions,
	parseMineralDoses,
	waterMeasurements
} from './water';

const apax: MineralAddition = { id: 'a1', product: 'Apax Lab', unit: 'drops', stage: 'in-cup', min: 0, max: 10, step: 1, default: 2 };
const profile: WaterProfile = { id: 'w1', name: 'Filtered + Apax', additions: [apax] };

describe('mineral dose snapshot', () => {
	it('records each addition, using the default for untouched ones and clamping to range', () => {
		const sachet: MineralAddition = { id: 'a2', product: 'Third Wave', unit: 'sachet', stage: 'brew-water', min: 0, max: 1, step: 1, default: 1 };

		expect(mineralDosesSnapshot({ ...profile, additions: [apax, sachet] }, { a1: 3, a2: 4 })).toEqual([
			{ additionId: 'a1', product: 'Apax Lab', unit: 'drops', stage: 'in-cup', amount: 3 },
			{ additionId: 'a2', product: 'Third Wave', unit: 'sachet', stage: 'brew-water', amount: 1 }
		]);
		expect(mineralDosesSnapshot(profile, {})[0].amount).toBe(2);
	});

	it('records nothing without a water profile', () => {
		expect(mineralDosesSnapshot(undefined, { a1: 3 })).toEqual([]);
	});

	it('formats amounts with and without a unit', () => {
		expect(formatDose({ amount: 3, unit: 'drops' })).toBe('3 drops');
		expect(formatDose({ amount: 1.5 })).toBe('1.5');
	});
});

describe('last water choice', () => {
	const brew = (id: string, waterProfile?: string, amount = 3) =>
		({ id, waterProfile, mineralDoses: waterProfile ? [{ additionId: 'a1', product: 'Apax Lab', stage: 'in-cup', amount }] : [] }) as Brew;

	it('reuses the most recent brew water and its amounts', () => {
		expect(lastWaterChoice([brew('br2', 'w1', 3), brew('br1', 'w1', 2)], [profile])).toEqual({
			waterProfile: 'w1',
			mineralDoses: { a1: 3 }
		});
	});

	it('skips brews whose profile is retired or deleted', () => {
		const brews = [brew('br3', 'gone'), brew('br2', 'w2'), brew('br1', 'w1', 2)];
		expect(lastWaterChoice(brews, [profile, { ...profile, id: 'w2', retired: true }]).waterProfile).toBe('w1');
	});

	it('starts with no water when no brew has one', () => {
		expect(lastWaterChoice([brew('br1')], [profile])).toEqual({ waterProfile: null, mineralDoses: {} });
	});
});

describe('stored mineral JSON', () => {
	it('drops malformed additions and doses instead of failing the row', () => {
		const additions = JSON.stringify([apax, { ...apax, id: 'bad', stage: 'later' }, { ...apax, id: 'bad2', step: 0 }]);
		const doses = JSON.stringify([{ additionId: 'a1', product: 'Apax Lab', stage: 'in-cup', amount: 3 }, { additionId: 'a2', amount: 'lots' }]);

		expect(parseMineralAdditions(additions)).toEqual([apax]);
		expect(parseMineralDoses(doses)).toEqual([{ additionId: 'a1', product: 'Apax Lab', stage: 'in-cup', amount: 3 }]);
		expect(parseMineralAdditions('not json')).toEqual([]);
	});
});

describe('mineral addition form', () => {
	it('requires a product and a usable range', () => {
		expect(isValidMineralAddition(apax)).toBe(true);
		expect(isValidMineralAddition({ ...apax, product: '  ' })).toBe(false);
		expect(isValidMineralAddition({ ...apax, min: 5, max: 1 })).toBe(false);
	});

	it('trims text, drops an empty unit and pulls the default into range', () => {
		expect(normalizeMineralAddition({ ...apax, product: ' Apax ', unit: ' ', default: 20 })).toEqual({
			id: 'a1', product: 'Apax', stage: 'in-cup', min: 0, max: 10, step: 1, default: 10
		});
	});

	it('summarises whichever measurements were recorded', () => {
		expect(waterMeasurements({ gh: 50, tds: 120 })).toBe('GH 50 · TDS 120 ppm');
		expect(waterMeasurements({})).toBeUndefined();
	});
});
