import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { SyncRecord } from '$lib/sync/protocol';
import type { Brew } from '$lib/data/types';
import { calendarDate } from '$lib/data/date';
import { resetMemoryDb } from './memory-db';

vi.mock('./index', () => import('./memory-db'));

const { applyRemoteRecord } = await import('./sync-queries');
const { getAllBrews, getAllMachines, insertBrew } = await import('./queries');

const brew: Brew = {
	id: 'br1', beanId: 'b1', method: 'espresso', date: calendarDate('2026-10-27'), time: '12:11',
	grinder: 'g1', machine: 'm1', grindSetting: 7, doseIn: 18.2, yieldOut: 50,
	extractionTime: 34, temperature: 96, ratio: '1:2.7', rating: null, espressoDrink: 'Espresso'
};

const record = (entity: SyncRecord['entity'], id: string, updatedAt: number, payload: unknown): SyncRecord => ({
	entity, id, updatedAt, deleted: false, payload
});

describe('sync record application', () => {
	beforeEach(resetMemoryDb);

	it('applies a brew and a machine pulled from another device', async () => {
		const options = [{ id: 'o1', label: 'Pre-infusion time', unit: 's', min: 0, max: 90, step: 1, default: 7 }];
		expect(await applyRemoteRecord(record('brew', 'br1', 1, brew))).toBe(true);
		expect(await applyRemoteRecord(record('machine', 'm1', 2, {
			id: 'm1', name: 'Dual Boiler', maker: 'Breville', type: 'Dual boiler', retired: false, brewOptions: options
		}))).toBe(true);

		expect((await getAllBrews()).map((b) => b.id)).toEqual(['br1']);
		expect((await getAllMachines())[0].brewOptions).toEqual(options);
	});

	it('keeps recorded machine settings when an older client re-sends the brew without them', async () => {
		const settings = [{ optionId: 'o1', label: 'Pre-infusion time', unit: 's', value: 10 }];
		await insertBrew({ ...brew, machineSettings: settings });
		await applyRemoteRecord(record('brew', 'br1', Date.now() + 1000, { ...brew, rating: 8 }));

		const [stored] = await getAllBrews();
		expect(stored.rating).toBe(8);
		expect(stored.machineSettings).toEqual(settings);
	});
});
