import { SAMPLE_BEANS, SAMPLE_BREWS, SAMPLE_GRINDERS } from '$lib/data/sample';
import type { Bean, Brew, Grinder } from '$lib/data/types';
import { openDb, exec, query, isPersistent } from '$lib/db/index';
import {
	getAllBeans,
	getAllBrews,
	getAllGrinders,
	insertBean,
	insertBrew,
	insertGrinder,
	softDeleteBean,
	softDeleteBrew,
	softDeleteGrinder
} from '$lib/db/queries';
import { sync } from '$lib/sync/engine.svelte';

let beans = $state<Bean[]>([]);
let brews = $state<Brew[]>([]);
let grinders = $state<Grinder[]>([]);
let ready = $state(false);
let persistent = $state(false);
let error = $state<string | null>(null);

async function seedIfEmpty(): Promise<void> {
	// Sample data is a dev convenience only — real usage starts empty.
	if (!import.meta.env.DEV) return;
	const rows = await query<{ value: string }>("SELECT value FROM _meta WHERE key = 'seeded'");
	if (rows.length) return;
	for (const bean of SAMPLE_BEANS) await insertBean(bean);
	for (const grinder of SAMPLE_GRINDERS) await insertGrinder(grinder);
	for (const brew of SAMPLE_BREWS) await insertBrew(brew);
	await exec("INSERT INTO _meta (key, value) VALUES ('seeded', '1')");
}

async function init(): Promise<void> {
	try {
		await openDb();
		persistent = isPersistent();
		await seedIfEmpty();
		beans = await getAllBeans();
		brews = await getAllBrews();
		grinders = await getAllGrinders();
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
	grinders = await getAllGrinders();
}

function addBrew(brew: Brew): void {
	brews = [brew, ...brews];
	const idx = beans.findIndex((b) => b.id === brew.beanId);
	if (idx >= 0) {
		beans = beans.map((b, i) => (i === idx ? { ...b, brews: b.brews + 1 } : b));
	}
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
	sync.schedule();
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
	get ready() { return ready; },
	get persistent() { return persistent; },
	get error() { return error; },
	init,
	reload,
	addBrew,
	addBean,
	addGrinder,
	deleteBrew,
	deleteBean,
	deleteGrinder
};
