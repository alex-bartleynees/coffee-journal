import { SAMPLE_BEANS, SAMPLE_BREWS, SAMPLE_GRINDERS, SAMPLE_MACHINES, SAMPLE_METHODS } from '$lib/data/sample';
import type { Bean, Brew, Grinder, Machine, MethodDef, Recipe } from '$lib/data/types';
import { openDb, exec, query, isPersistent } from '$lib/db/index';
import {
	getAllBeans,
	getAllBrews,
	getAllGrinders,
	getAllMachines,
	getAllMethods,
	getAllRecipes,
	upsertBeanPhoto,
	deleteBeanPhoto,
	insertBean,
	insertBrew,
	insertGrinder,
	insertMachine,
	insertMethod,
	insertRecipe,
	softDeleteBean,
	softDeleteBrew,
	softDeleteGrinder,
	softDeleteMachine,
	softDeleteMethod,
	softDeleteRecipe
} from '$lib/db/queries';
import { sync } from '$lib/sync/engine.svelte';
import { ensureDefaultMethods } from '$lib/db/default-methods';
import { beanInventory } from '$lib/data/bean-inventory';

let beans = $state<Bean[]>([]);
let brews = $state<Brew[]>([]);
let grinders = $state<Grinder[]>([]);
let machines = $state<Machine[]>([]);
let methods = $state<MethodDef[]>([]);
let recipes = $state<Recipe[]>([]);
let ready = $state(false);
let persistent = $state(false);
let error = $state<string | null>(null);

/**
 * Local writes are optimistic: the UI updates immediately and the SQLite write
 * runs behind it. A failed write is kept here (with a way to re-run it) so the
 * layout can warn that the change is only on screen and offer a retry, instead
 * of the change silently vanishing on the next reload.
 */
type FailedWrite = { label: string; write: () => Promise<void> };
let failedWrites = $state.raw<FailedWrite[]>([]);

function persist(label: string, write: () => Promise<void>): void {
	write().catch((e) => {
		console.error(`Couldn't save ${label}`, e);
		failedWrites = [...failedWrites, { label, write }];
	});
}

/** Re-run failed writes in order; any that fail again stay queued. */
async function retryFailedWrites(): Promise<void> {
	const pending = failedWrites;
	failedWrites = [];
	const stillFailing: FailedWrite[] = [];
	for (const failed of pending) {
		try {
			await failed.write();
		} catch (e) {
			console.error(`Couldn't save ${failed.label}`, e);
			stillFailing.push(failed);
		}
	}
	failedWrites = [...stillFailing, ...failedWrites];
	if (stillFailing.length < pending.length) sync.schedule();
}

function finishConsumedBeans(): void {
	beans = beans.map((bean) => {
		if (bean.finished) return bean;
		const doses = brews.filter((brew) => brew.beanId === bean.id).map((brew) => brew.doseIn);
		if (!beanInventory(bean.bagWeight, doses).finished) return bean;
		const finishedBean = { ...bean, finished: true };
		persist('bean', () => insertBean(finishedBean));
		return finishedBean;
	});
}

async function seedIfEmpty(): Promise<void> {
	// Sample data is a dev convenience only — real usage starts empty.
	if (!import.meta.env.DEV) return;
	const rows = await query<{ value: string }>("SELECT value FROM _meta WHERE key = 'seeded'");
	if (rows.length) return;
	for (const bean of SAMPLE_BEANS) await insertBean(bean);
	for (const grinder of SAMPLE_GRINDERS) await insertGrinder(grinder);
	for (const machine of SAMPLE_MACHINES) await insertMachine(machine);
	for (const brew of SAMPLE_BREWS) await insertBrew(brew);
	await exec("INSERT INTO _meta (key, value) VALUES ('seeded', '1')");
}

async function init(): Promise<void> {
	try {
		await openDb();
		persistent = isPersistent();
		await ensureDefaultMethods(
			{
				async markerExists(key) {
					return (await query<{ value: string }>('SELECT value FROM _meta WHERE key = ?', [key])).length > 0;
				},
				async insertIfMissing(method) {
					await exec(
						`INSERT OR IGNORE INTO methods
							(id, label, icon, notes, updated_at, deleted, dirty) VALUES (?,?,?,NULL,0,0,0)`,
						[method.id, method.label, method.icon]
					);
				},
				async setMarker(key) {
					await exec('INSERT OR REPLACE INTO _meta (key, value) VALUES (?, ?)', [key, '1']);
				}
			},
			SAMPLE_METHODS
		);
		await seedIfEmpty();
		beans = await getAllBeans();
		brews = await getAllBrews();
		finishConsumedBeans();
		grinders = await getAllGrinders();
		machines = await getAllMachines();
		methods = await getAllMethods();
		recipes = await getAllRecipes();
	} catch (e) {
		error = e instanceof Error ? e.message : String(e);
		console.error('Database initialization failed', e);
	} finally {
		ready = true;
	}
}

/** Re-read all tables from SQLite — used by the sync engine after remote changes land. */
async function reload(): Promise<void> {
	beans = await getAllBeans();
	brews = await getAllBrews();
	finishConsumedBeans();
	grinders = await getAllGrinders();
	machines = await getAllMachines();
	methods = await getAllMethods();
	recipes = await getAllRecipes();
}

function addBrew(brew: Brew): void {
	brews = [brew, ...brews];
	const idx = beans.findIndex((b) => b.id === brew.beanId);
	if (idx >= 0) {
		beans = beans.map((b, i) => (i === idx ? { ...b, brews: b.brews + 1 } : b));
	}
	finishConsumedBeans();
	persist('brew', () => insertBrew(brew));
	sync.schedule();
}

function addBean(bean: Bean): void {
	beans = [bean, ...beans];
	persist('bean', () => insertBean(bean));
	sync.schedule();
}

function addGrinder(grinder: Grinder): void {
	grinders = [...grinders, grinder].sort((a, b) => a.name.localeCompare(b.name));
	persist('grinder', () => insertGrinder(grinder));
	sync.schedule();
}

function updateBrew(updated: Brew): void {
	const existing = brews.find((brew) => brew.id === updated.id);
	if (!existing) {
		console.error(`Cannot update missing brew ${updated.id}`);
		return;
	}

	brews = brews
		.map((brew) => (brew.id === updated.id ? updated : brew))
		.sort((a, b) => b.date.localeCompare(a.date) || b.time.localeCompare(a.time));
	if (existing.beanId !== updated.beanId) {
		beans = beans.map((bean) => {
			if (bean.id === existing.beanId) return { ...bean, brews: Math.max(0, bean.brews - 1) };
			if (bean.id === updated.beanId) return { ...bean, brews: bean.brews + 1 };
			return bean;
		});
	}
	finishConsumedBeans();
	persist('brew', () => insertBrew(updated));
	sync.schedule();
}

function updateBean(updated: Bean): void {
	const existing = beans.find((bean) => bean.id === updated.id);
	if (!existing) {
		console.error(`Cannot update missing bean ${updated.id}`);
		return;
	}
	beans = beans
		.map((bean) => (bean.id === updated.id
			? { ...updated, brews: existing.brews, photoUrl: updated.photoUrl ?? existing.photoUrl }
			: bean))
		.sort((a, b) => b.dateOpened.localeCompare(a.dateOpened));
	persist('bean', () => insertBean({ ...updated, brews: existing.brews }));
	sync.schedule();
}

function finishBean(id: string): void {
	const bean = beans.find((candidate) => candidate.id === id);
	if (!bean || bean.finished) return;
	updateBean({ ...bean, finished: true });
}

function updateGrinder(updated: Grinder): void {
	if (!grinders.some((grinder) => grinder.id === updated.id)) {
		console.error(`Cannot update missing grinder ${updated.id}`);
		return;
	}
	grinders = grinders
		.map((grinder) => (grinder.id === updated.id ? updated : grinder))
		.sort((a, b) => a.name.localeCompare(b.name));
	persist('grinder', () => insertGrinder(updated));
	sync.schedule();
}

function addMachine(machine: Machine): void {
	machines = [...machines, machine].sort((a, b) => a.name.localeCompare(b.name));
	persist('machine', () => insertMachine(machine));
	sync.schedule();
}

function updateMachine(updated: Machine): void {
	if (!machines.some((machine) => machine.id === updated.id)) {
		console.error(`Cannot update missing machine ${updated.id}`);
		return;
	}
	machines = machines
		.map((machine) => (machine.id === updated.id ? updated : machine))
		.sort((a, b) => a.name.localeCompare(b.name));
	persist('machine', () => insertMachine(updated));
	sync.schedule();
}

function toggleGrinderRetired(id: string): void {
	const grinder = grinders.find((candidate) => candidate.id === id);
	if (grinder) updateGrinder({ ...grinder, retired: !grinder.retired });
}

function toggleMachineRetired(id: string): void {
	const machine = machines.find((candidate) => candidate.id === id);
	if (machine) updateMachine({ ...machine, retired: !machine.retired });
}

function deleteMachine(id: string): void {
	machines = machines.filter((m) => m.id !== id);
	persist('machine', () => softDeleteMachine(id));
	sync.schedule();
}

function addMethod(method: MethodDef): void {
	methods = [...methods, method];
	persist('method', () => insertMethod(method));
	sync.schedule();
}

function updateMethod(updated: MethodDef): void {
	if (!methods.some((method) => method.id === updated.id)) {
		console.error(`Cannot update missing method ${updated.id}`);
		return;
	}
	methods = methods.map((method) => (method.id === updated.id ? updated : method));
	persist('method', () => insertMethod(updated));
	sync.schedule();
}

function deleteMethod(id: string): void {
	methods = methods.filter((m) => m.id !== id);
	persist('method', () => softDeleteMethod(id));
	sync.schedule();
}

function addRecipe(recipe: Recipe): void {
	recipes = [...recipes, recipe].sort((a, b) => a.name.localeCompare(b.name));
	persist('recipe', () => insertRecipe(recipe));
	sync.schedule();
}

function updateRecipe(updated: Recipe): void {
	if (!recipes.some((recipe) => recipe.id === updated.id)) {
		console.error(`Cannot update missing recipe ${updated.id}`);
		return;
	}
	recipes = recipes
		.map((recipe) => (recipe.id === updated.id ? updated : recipe))
		.sort((a, b) => a.name.localeCompare(b.name));
	persist('recipe', () => insertRecipe(updated));
	sync.schedule();
}

function deleteRecipe(id: string): void {
	recipes = recipes.filter((recipe) => recipe.id !== id);
	persist('recipe', () => softDeleteRecipe(id));
	sync.schedule();
}

function deleteBrew(id: string): void {
	const brew = brews.find((b) => b.id === id);
	brews = brews.filter((b) => b.id !== id);
	if (brew) {
		const idx = beans.findIndex((b) => b.id === brew.beanId);
		if (idx >= 0) {
			beans = beans.map((b, i) => (i === idx ? { ...b, brews: Math.max(0, b.brews - 1) } : b));
		}
	}
	persist('brew', () => softDeleteBrew(id));
	sync.schedule();
}

function deleteBean(id: string): void {
	beans = beans.filter((b) => b.id !== id);
	persist('bean', () => softDeleteBean(id));
	persist('bean photo', () => deleteBeanPhoto(id));
	sync.schedule();
}

async function saveBeanPhoto(beanId: string, image: Blob): Promise<void> {
	const url = await upsertBeanPhoto(beanId, image);
	beans = beans.map((bean) => bean.id === beanId ? { ...bean, photoUrl: url } : bean);
}

async function removeBeanPhoto(beanId: string): Promise<void> {
	await deleteBeanPhoto(beanId);
	beans = beans.map((bean) => {
		if (bean.id !== beanId) return bean;
		const { photoUrl: _, ...withoutPhoto } = bean;
		return withoutPhoto;
	});
}

function deleteGrinder(id: string): void {
	grinders = grinders.filter((g) => g.id !== id);
	persist('grinder', () => softDeleteGrinder(id));
	sync.schedule();
}

export const journal = {
	get beans() { return beans; },
	get brews() { return brews; },
	get grinders() { return grinders; },
	get machines() { return machines; },
	get methods() { return methods; },
	get recipes() { return recipes; },
	get ready() { return ready; },
	get persistent() { return persistent; },
	get error() { return error; },
	/** Labels of local writes that failed and are only reflected in memory. */
	get failedWrites() { return failedWrites.map((failed) => failed.label); },
	retryFailedWrites,
	init,
	reload,
	addBrew,
	addBean,
	addGrinder,
	addMachine,
	addMethod,
	addRecipe,
	updateBrew,
	updateBean,
	finishBean,
	updateGrinder,
	updateMachine,
	toggleGrinderRetired,
	toggleMachineRetired,
	updateMethod,
	updateRecipe,
	deleteBrew,
	deleteBean,
	saveBeanPhoto,
	removeBeanPhoto,
	deleteGrinder,
	deleteMachine,
	deleteMethod,
	deleteRecipe
};
