import { beforeEach, describe, expect, it, vi } from 'vitest';
import { calendarDate } from '$lib/data/date';
import type { Bean, Brew, Grinder, Machine, MethodDef, Recipe, WaterProfile } from '$lib/data/types';
import { resetMemoryDb } from './memory-db';

vi.mock('./index', () => import('./memory-db'));

const q = await import('./queries');

// Every optional field is filled in, so a column that is written but not read
// back (or a VALUES list out of step with its columns) fails the round trip.
const bean: Bean = {
	id: 'b1', name: 'Gobena Bendo', roaster: 'Rocket', origin: 'Ethiopia', process: 'Washed',
	varietal: 'Landrace', roast: 'light', altitude: '2200m', tasting: ['Mandarin', 'Berry tea'],
	dateOpened: calendarDate('2026-10-25'), roastDate: calendarDate('2026-10-13'),
	pricePerKg: 112, bagWeight: 250, brews: 0, finished: true
};

const grinder: Grinder = {
	id: 'g1', name: 'Niche', maker: 'Niche', range: [0, 50], step: 0.5, type: 'espresso',
	burr: '63mm conical', rpm: 330, notes: 'Daily', retired: true,
	presets: [{ method: 'espresso', setting: 12.5 }, { method: 'v60', setting: 40 }]
};

const machine: Machine = {
	id: 'm1', name: 'Dual Boiler', maker: 'Breville', type: 'Dual boiler', retired: true,
	method: 'espresso', notes: 'Bought 26 Oct',
	brewOptions: [{ id: 'o1', label: 'Pre-infusion time', unit: 's', min: 0, max: 15, step: 1, default: 7 }]
};

const waterProfile: WaterProfile = {
	id: 'w1', name: 'Filtered + Apax', base: 'Brita filtered tap', gh: 50, kh: 40, tds: 120,
	notes: 'Shake first', retired: true,
	additions: [{ id: 'a1', product: 'Apax Lab', unit: 'drops', stage: 'in-cup', min: 0, max: 10, step: 1, default: 2 }]
};

const method: MethodDef = { id: 'siphon', label: 'Siphon', icon: 'cup', notes: 'Low heat' };

const recipe: Recipe = {
	id: 'r1', methodId: 'v60', name: 'Morning V60', beanId: 'b1', doseIn: 15, yieldOut: 250,
	temperature: 94, grind: 'Medium-fine', targetTime: 180, notes: 'Swirl at end',
	steps: [{ id: 's1', label: 'Bloom', time: 0, water: 45 }, { id: 's2', label: 'Pour', time: 45 }]
};

const brew: Brew = {
	id: 'br1', beanId: 'b1', method: 'espresso', date: calendarDate('2026-10-27'), time: '12:11',
	grinder: 'g1', machine: 'm1',
	machineSettings: [{ optionId: 'o1', label: 'Pre-infusion time', unit: 's', value: 10 }],
	waterProfile: 'w1',
	mineralDoses: [{ additionId: 'a1', product: 'Apax Lab', unit: 'drops', stage: 'in-cup', amount: 3 }],
	grindSetting: 7, doseIn: 18.2, yieldOut: 50, extractionTime: 34, temperature: 96, ratio: '1:2.7',
	recipeNotes: 'Grind finer', recipeId: 'r1', rating: 8, rating2: 7.5, aroma: 'Floral',
	flavor: 'Citrus', body: 'Light', finish: 'Clean', descriptors: ['Bright'], withMilk: true,
	milkDrink: 'Flat White', espressoDrink: 'Flat White', cutsThruMilk: true, buyAgain: 'Yes',
	bestFor: 'Daily driver', favorite: true
};

describe('local writes round-trip through the real schema', () => {
	beforeEach(resetMemoryDb);

	it('saves and reads back a bean', async () => {
		await q.insertBean(bean);
		expect(await q.getAllBeans()).toEqual([bean]);
	});

	it('saves and reads back a grinder with presets', async () => {
		await q.insertGrinder(grinder);
		expect(await q.getAllGrinders()).toEqual([grinder]);
	});

	it('saves and reads back a machine with brew options', async () => {
		await q.insertMachine(machine);
		expect(await q.getAllMachines()).toEqual([machine]);
	});

	it('saves and reads back a water profile with mineral additions', async () => {
		await q.insertWaterProfile(waterProfile);
		expect(await q.getAllWaterProfiles()).toEqual([waterProfile]);
	});

	it('saves and reads back a method', async () => {
		await q.insertMethod(method);
		expect(await q.getAllMethods()).toEqual([method]);
	});

	it('saves and reads back a recipe with steps', async () => {
		await q.insertRecipe(recipe);
		expect(await q.getAllRecipes()).toEqual([recipe]);
	});

	it('saves and reads back a brew with every field set', async () => {
		await q.insertBrew(brew);
		expect(await q.getAllBrews()).toEqual([brew]);
	});

	it('hides soft-deleted records from every list', async () => {
		await q.insertBean(bean);
		await q.insertGrinder(grinder);
		await q.insertMachine(machine);
		await q.insertMethod(method);
		await q.insertRecipe(recipe);
		await q.insertWaterProfile(waterProfile);
		await q.insertBrew(brew);

		await q.softDeleteBean(bean.id);
		await q.softDeleteGrinder(grinder.id);
		await q.softDeleteMachine(machine.id);
		await q.softDeleteMethod(method.id);
		await q.softDeleteRecipe(recipe.id);
		await q.softDeleteWaterProfile(waterProfile.id);
		await q.softDeleteBrew(brew.id);

		expect(await q.getAllBeans()).toEqual([]);
		expect(await q.getAllGrinders()).toEqual([]);
		expect(await q.getAllMachines()).toEqual([]);
		expect(await q.getAllMethods()).toEqual([]);
		expect(await q.getAllRecipes()).toEqual([]);
		expect(await q.getAllWaterProfiles()).toEqual([]);
		expect(await q.getAllBrews()).toEqual([]);
	});
});

describe('upcoming beans', () => {
 beforeEach(resetMemoryDb);

 it('persists an unopened bag, syncs it, and records opening it', async () => {
  const upcoming = { ...bean, finished: undefined, upcoming: true };
  await q.insertBean(upcoming);
  expect(await q.getAllBeans()).toEqual([upcoming]);
  const { getDirtyRecords, applyRemoteRecord } = await import('./sync-queries');
  const [record] = await getDirtyRecords();
  expect(record.payload).toMatchObject({ upcoming: true });
  resetMemoryDb();
  await applyRemoteRecord(record);
  expect(await q.getAllBeans()).toEqual([upcoming]);
  await q.insertBean({ ...upcoming, upcoming: undefined, dateOpened: calendarDate('2026-10-31') });
  expect((await q.getAllBeans())[0]).toMatchObject({
   upcoming: undefined, dateOpened: '2026-10-31'
  });
 });
});
