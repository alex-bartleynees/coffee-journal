import { describe, expect, it } from 'vitest';
import {
	formatSetting,
	isValidBrewOption,
	normalizeBrewOption,
	machineSettingsSnapshot,
	optionValue,
	parseBrewOptions,
	parseMachineSettings,
	settingValues
} from './machine-options';
import type { Machine, MachineBrewOption } from './types';

const piTime: MachineBrewOption = { id: 'pi-time', label: 'Pre-infusion time', unit: 's', min: 0, max: 15, step: 1, default: 7 };
const piPower: MachineBrewOption = { id: 'pi-power', label: 'Pre-infusion power', unit: '%', min: 55, max: 99, step: 1, default: 60 };
const bdb: Machine = { id: 'm1', name: 'Dual Boiler', maker: 'Breville', type: 'dual-boiler', brewOptions: [piTime, piPower] };

describe('machine brew options', () => {
	it('falls back to the option default when the draft has no value', () => {
		expect(optionValue(piTime, {})).toBe(7);
	});

	it('clamps out-of-range values to the option bounds', () => {
		expect(optionValue(piPower, { 'pi-power': 120 })).toBe(99);
	});

	it('snapshots every option on the machine with its label and unit', () => {
		expect(machineSettingsSnapshot(bdb, { 'pi-time': 10 })).toEqual([
			{ optionId: 'pi-time', label: 'Pre-infusion time', unit: 's', value: 10 },
			{ optionId: 'pi-power', label: 'Pre-infusion power', unit: '%', value: 60 }
		]);
	});

	it('snapshots nothing for a brew without a machine', () => {
		expect(machineSettingsSnapshot(undefined, { 'pi-time': 10 })).toEqual([]);
	});

	it('round-trips snapshot values back into draft values', () => {
		expect(settingValues(machineSettingsSnapshot(bdb, { 'pi-time': 4 }))).toEqual({ 'pi-time': 4, 'pi-power': 60 });
	});

	it('formats percentages without a space and other units with one', () => {
		expect(formatSetting({ unit: '%', value: 60 })).toBe('60%');
		expect(formatSetting({ unit: 's', value: 7 })).toBe('7 s');
	});

	it('drops malformed stored options instead of failing the row', () => {
		const raw = JSON.stringify([piTime, { id: 'bad', label: 'No bounds' }, { ...piPower, step: 0 }]);
		expect(parseBrewOptions(raw)).toEqual([piTime]);
		expect(parseBrewOptions('not json')).toEqual([]);
		expect(parseMachineSettings(JSON.stringify([{ optionId: 'x', label: 'X', value: 'nope' }]))).toEqual([]);
	});
});

describe('machine form option editing', () => {
	it('rejects options without a label or with inverted bounds', () => {
		expect(isValidBrewOption({ ...piTime, label: '  ' })).toBe(false);
		expect(isValidBrewOption({ ...piTime, min: 20, max: 10 })).toBe(false);
		expect(isValidBrewOption({ ...piTime, step: Number.NaN })).toBe(false);
		expect(isValidBrewOption(piTime)).toBe(true);
	});

	it('trims text, drops an empty unit, and clamps the default on save', () => {
		expect(normalizeBrewOption({ ...piPower, label: ' Power ', unit: ' ', default: 40 })).toEqual({
			id: 'pi-power', label: 'Power', min: 55, max: 99, step: 1, default: 55
		});
	});
});
