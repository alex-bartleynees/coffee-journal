import { SAMPLE_BEANS, SAMPLE_BREWS, SAMPLE_GRINDERS, SAMPLE_MACHINES, SAMPLE_METHODS } from '$lib/data/sample';
import type { Bean, Brew, Grinder, Machine, MethodDef } from '$lib/data/types';
import { openDb, exec, query, isPersistent } from '$lib/db/index';
import {
	getAllBeans,
	getAllBrews,
	getAllGrinders,
	getAllMachines,
	getAllMethods,
	upsertBeanPhoto,
	deleteBeanPhoto,
	insertBean,
	insertBrew,
	insertGrinder,
	insertMachine,
	insertMethod,
	softDeleteBean,
	softDeleteBrew,
	softDeleteGrinder,
	softDeleteMachine,
	softDeleteMethod
} from '$lib/db/queries';
import { sync } from '$lib/sync/engine.svelte';
import { ensureDefaultMethods } from '$lib/db/default-methods';
import { beanInventory } from '$lib/data/bean-inventory';

let beans = $state<Bean[]>([]);
let brews = $state<Brew[]>([]);
let grinders = $state<Grinder[]>([]);
let machines = $state<Machine[]>([]);
let methods = $state<MethodDef[]>([]);
let ready = $state(false);
let persistent = $state(false);
let error = $state<string | null>(null);

function finishConsumedBeans(): void {
	beans = beans.map((bean) => {
		if (bean.finished) return bean;
		const doses = brews.filter((brew) => brew.beanId === bean.id).map((brew) => brew.doseIn);
		if (!beanInventory(bean.bagWeight, doses).finished) return bean;
		const finishedBean = { ...bean, finished: true };
		insertBean(finishedBean).catch(console.error);
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
}

function addBrew(brew: Brew): void {
	brews = [brew, ...brews];
	const idx = beans.findIndex((b) => b.id === brew.beanId);
	if (idx >= 0) {
		beans = beans.map((b, i) => (i === idx ? { ...b, brews: b.brews + 1 } : b));
	}
	finishConsumedBeans();
	insertBrew(brew).catch(console.error);
	sync.schedule();
}

function addBean(bean: Bean): void {
	beans = [bean, ...beans];
	insertBean(bean).catch(console.error);
	sync.schedule();
}

function addGrinder(grinder: Grinder): void {
	grinders = [...grinders, grinder].sort((a, b) => a.name.localeCompare(b.name));
	insertGrinder(grinder).catch(console.error);
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
	insertBrew(updated).catch(console.error);
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
	insertBean({ ...updated, brews: existing.brews }).catch(console.error);
	sync.schedule();
}

function updateGrinder(updated: Grinder): void {
	if (!grinders.some((grinder) => grinder.id === updated.id)) {
		console.error(`Cannot update missing grinder ${updated.id}`);
		return;
	}
	grinders = grinders
		.map((grinder) => (grinder.id === updated.id ? updated : grinder))
		.sort((a, b) => a.name.localeCompare(b.name));
	insertGrinder(updated).catch(console.error);
	sync.schedule();
}

function addMachine(machine: Machine): void {
	machines = [...machines, machine].sort((a, b) => a.name.localeCompare(b.name));
	insertMachine(machine).catch(console.error);
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
	insertMachine(updated).catch(console.error);
	sync.schedule();
}

function deleteMachine(id: string): void {
	machines = machines.filter((m) => m.id !== id);
	softDeleteMachine(id).catch(console.error);
	sync.schedule();
}

function addMethod(method: MethodDef): void {
	methods = [...methods, method];
	insertMethod(method).catch(console.error);
	sync.schedule();
}

function updateMethod(updated: MethodDef): void {
	if (!methods.some((method) => method.id === updated.id)) {
		console.error(`Cannot update missing method ${updated.id}`);
		return;
	}
	methods = methods.map((method) => (method.id === updated.id ? updated : method));
	insertMethod(updated).catch(console.error);
	sync.schedule();
}

function deleteMethod(id: string): void {
	methods = methods.filter((m) => m.id !== id);
	softDeleteMethod(id).catch(console.error);
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
	softDeleteBrew(id).catch(console.error);
	sync.schedule();
}

function deleteBean(id: string): void {
	beans = beans.filter((b) => b.id !== id);
	softDeleteBean(id).catch(console.error);
	deleteBeanPhoto(id).catch(console.error);
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
	softDeleteGrinder(id).catch(console.error);
	sync.schedule();
}

export const journal = {
	get beans() { return beans; },
	get brews() { return brews; },
	get grinders() { return grinders; },
	get machines() { return machines; },
	get methods() { return methods; },
	get ready() { return ready; },
	get persistent() { return persistent; },
	get error() { return error; },
	init,
	reload,
	addBrew,
	addBean,
	addGrinder,
	addMachine,
	addMethod,
	updateBrew,
	updateBean,
	updateGrinder,
	updateMachine,
	updateMethod,
	deleteBrew,
	deleteBean,
	saveBeanPhoto,
	removeBeanPhoto,
	deleteGrinder,
	deleteMachine,
	deleteMethod
};
