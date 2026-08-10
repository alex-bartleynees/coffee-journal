import { exec, query } from './index';
import type { Bean, Brew, Grinder, Method } from '$lib/data/types';

/**
 * Sync bookkeeping stamped onto every row write. Local (user-originated) writes
 * use `localWriteMeta()` — dirty, so the sync engine picks them up. When the
 * sync engine applies a *remote* record it passes the server's values instead
 * (dirty=0, the server's updated_at). See [[Sync-Protocol]].
 */
export type SyncMeta = { updatedAt: number; dirty: 0 | 1; deleted: 0 | 1 };

export function localWriteMeta(): SyncMeta {
	return { updatedAt: Date.now(), dirty: 1, deleted: 0 };
}

export type BeanRow = {
	id: string; name: string; roaster: string; origin: string; process: string;
	varietal: string; roast: string; altitude: string; tasting: string;
	date_opened: string; roast_date: string; price_per_kg: number;
	bag_weight: number; finished: number; brews?: number;
};

export type BrewRow = {
	id: string; bean_id: string; method: string; date: string; time: string;
	grinder: string; grind_setting: number; dose_in: number; yield_out: number;
	extraction_time: number; temperature: number; ratio: string; rating: number;
	rating2: number | null; aroma: string | null; flavor: string | null;
	body: string | null; finish: string | null; descriptors: string | null;
	with_milk: number | null; cuts_thru_milk: number | null;
	buy_again: string | null; best_for: string | null; recipe_notes: string | null;
	favorite: number;
};

export type GrinderRow = {
	id: string; name: string; maker: string; range_min: number; range_max: number;
	step: number; type: string; burr: string; rpm: number | null; notes: string | null;
};

export type PresetRow = { grinder_id: string; method: string; setting: number };
type BeanPhotoRow = { bean_id: string; mime_type: string; image_data: Uint8Array; updated_at: number };

const photoUrls = new Map<string, { updatedAt: number; url: string }>();

function photoUrl(row: BeanPhotoRow): string {
	const existing = photoUrls.get(row.bean_id);
	if (existing?.updatedAt === row.updated_at) return existing.url;
	if (existing) URL.revokeObjectURL(existing.url);
	const bytes = new Uint8Array(row.image_data.byteLength);
	bytes.set(row.image_data);
	const url = URL.createObjectURL(new Blob([bytes.buffer], { type: row.mime_type }));
	photoUrls.set(row.bean_id, { updatedAt: row.updated_at, url });
	return url;
}

export function beanFromRow(r: BeanRow): Bean {
	return {
		id: r.id, name: r.name, roaster: r.roaster, origin: r.origin,
		process: r.process, varietal: r.varietal, roast: r.roast as Bean['roast'],
		altitude: r.altitude, tasting: JSON.parse(r.tasting) as string[],
		dateOpened: r.date_opened, roastDate: r.roast_date,
		pricePerKg: r.price_per_kg, bagWeight: r.bag_weight,
		brews: r.brews ?? 0, finished: r.finished ? true : undefined
	};
}

export function brewFromRow(r: BrewRow): Brew {
	const brew: Brew = {
		id: r.id, beanId: r.bean_id, method: r.method as Brew['method'],
		date: r.date, time: r.time, grinder: r.grinder,
		grindSetting: r.grind_setting, doseIn: r.dose_in, yieldOut: r.yield_out,
		extractionTime: r.extraction_time, temperature: r.temperature,
		ratio: r.ratio, rating: r.rating, rating2: r.rating2 ?? null
	};
	if (r.aroma != null) brew.aroma = r.aroma;
	if (r.flavor != null) brew.flavor = r.flavor;
	if (r.body != null) brew.body = r.body;
	if (r.finish != null) brew.finish = r.finish;
	brew.descriptors = r.descriptors ? (JSON.parse(r.descriptors) as string[]) : [];
	if (r.with_milk != null) brew.withMilk = !!r.with_milk;
	if (r.cuts_thru_milk != null) brew.cutsThruMilk = !!r.cuts_thru_milk;
	brew.buyAgain = (r.buy_again as Brew['buyAgain']) ?? null;
	brew.bestFor = (r.best_for as Brew['bestFor']) ?? null;
	if (r.recipe_notes != null) brew.recipeNotes = r.recipe_notes;
	brew.favorite = !!r.favorite;
	return brew;
}

export function grinderFromRow(r: GrinderRow, presets: PresetRow[] = []): Grinder {
	const g: Grinder = {
		id: r.id, name: r.name, maker: r.maker,
		range: [r.range_min, r.range_max], step: r.step,
		type: r.type as Grinder['type'], burr: r.burr,
		rpm: r.rpm ?? null,
		presets: presets.map((p) => ({ method: p.method as Method, setting: p.setting }))
	};
	if (r.notes != null) g.notes = r.notes;
	return g;
}

export async function getAllBeans(): Promise<Bean[]> {
	const rows = await query<BeanRow>(`
		SELECT b.*, COUNT(br.id) AS brews
		FROM beans b
		LEFT JOIN brews br ON br.bean_id = b.id AND br.deleted = 0
		WHERE b.deleted = 0
		GROUP BY b.id
		ORDER BY b.date_opened DESC
	`);
	const photos = await query<BeanPhotoRow>('SELECT bean_id, mime_type, image_data, updated_at FROM bean_photos');
	const photosByBean = new Map(photos.map((photo) => [photo.bean_id, photoUrl(photo)]));
	return rows.map((row) => {
		const bean = beanFromRow(row);
		bean.photoUrl = photosByBean.get(bean.id);
		return bean;
	});
}

export async function upsertBeanPhoto(beanId: string, image: Blob): Promise<string> {
	const bytes = new Uint8Array(await image.arrayBuffer());
	const updatedAt = Date.now();
	await exec(
		`INSERT INTO bean_photos (bean_id, mime_type, image_data, updated_at) VALUES (?, ?, ?, ?)
		 ON CONFLICT(bean_id) DO UPDATE SET mime_type = excluded.mime_type,
		 image_data = excluded.image_data, updated_at = excluded.updated_at`,
		[beanId, image.type, bytes, updatedAt]
	);
	return photoUrl({ bean_id: beanId, mime_type: image.type, image_data: bytes, updated_at: updatedAt });
}

export async function deleteBeanPhoto(beanId: string): Promise<void> {
	await exec('DELETE FROM bean_photos WHERE bean_id = ?', [beanId]);
	const existing = photoUrls.get(beanId);
	if (existing) URL.revokeObjectURL(existing.url);
	photoUrls.delete(beanId);
}

export async function getAllBrews(): Promise<Brew[]> {
	const rows = await query<BrewRow>('SELECT * FROM brews WHERE deleted = 0 ORDER BY date DESC, time DESC');
	return rows.map(brewFromRow);
}

export async function getAllGrinders(): Promise<Grinder[]> {
	const rows = await query<GrinderRow>('SELECT * FROM grinders WHERE deleted = 0 ORDER BY name');
	const presets = await query<PresetRow>(
		'SELECT grinder_id, method, setting FROM grinder_presets ORDER BY grinder_id, id'
	);
	return rows.map((r) => grinderFromRow(r, presets.filter((p) => p.grinder_id === r.id)));
}

export async function insertBrew(brew: Brew, meta: SyncMeta = localWriteMeta()): Promise<void> {
	await exec(
		`INSERT OR REPLACE INTO brews
			(id, bean_id, method, date, time, grinder, grind_setting, dose_in, yield_out,
			 extraction_time, temperature, ratio, rating, rating2, aroma, flavor, body, finish,
			 descriptors, with_milk, cuts_thru_milk, buy_again, best_for, recipe_notes,
			 favorite, updated_at, deleted, dirty)
		VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
		[
			brew.id, brew.beanId, brew.method, brew.date, brew.time, brew.grinder,
			brew.grindSetting, brew.doseIn, brew.yieldOut, brew.extractionTime,
			brew.temperature, brew.ratio, brew.rating, brew.rating2 ?? null,
			brew.aroma ?? null, brew.flavor ?? null, brew.body ?? null, brew.finish ?? null,
			JSON.stringify(brew.descriptors ?? []),
			brew.withMilk != null ? (brew.withMilk ? 1 : 0) : null,
			brew.cutsThruMilk != null ? (brew.cutsThruMilk ? 1 : 0) : null,
			brew.buyAgain ?? null, brew.bestFor ?? null, brew.recipeNotes ?? null,
			brew.favorite ? 1 : 0,
			meta.updatedAt, meta.deleted, meta.dirty
		]
	);
}

export async function insertBean(bean: Bean, meta: SyncMeta = localWriteMeta()): Promise<void> {
	await exec(
		`INSERT OR REPLACE INTO beans
			(id, name, roaster, origin, process, varietal, roast, altitude, tasting,
			 date_opened, roast_date, price_per_kg, bag_weight, finished,
			 updated_at, deleted, dirty)
		VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
		[
			bean.id, bean.name, bean.roaster, bean.origin, bean.process, bean.varietal,
			bean.roast, bean.altitude, JSON.stringify(bean.tasting),
			bean.dateOpened, bean.roastDate, bean.pricePerKg, bean.bagWeight,
			bean.finished ? 1 : 0,
			meta.updatedAt, meta.deleted, meta.dirty
		]
	);
}

export async function insertGrinder(grinder: Grinder, meta: SyncMeta = localWriteMeta()): Promise<void> {
	await exec(
		`INSERT OR REPLACE INTO grinders
			(id, name, maker, range_min, range_max, step, type, burr, rpm, notes,
			 updated_at, deleted, dirty)
		VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
		[
			grinder.id, grinder.name, grinder.maker, grinder.range[0], grinder.range[1],
			grinder.step, grinder.type, grinder.burr, grinder.rpm ?? null, grinder.notes ?? null,
			meta.updatedAt, meta.deleted, meta.dirty
		]
	);
	await exec('DELETE FROM grinder_presets WHERE grinder_id = ?', [grinder.id]);
	for (const preset of grinder.presets) {
		await exec(
			'INSERT INTO grinder_presets (grinder_id, method, setting) VALUES (?,?,?)',
			[grinder.id, preset.method, preset.setting]
		);
	}
}

/**
 * Soft-delete: sets the tombstone + marks dirty so the deletion syncs. The row
 * stays until the delete has propagated (a later compaction pass can hard-delete
 * rows that are `deleted = 1 AND dirty = 0`). Reads all filter `deleted = 0`, so
 * a soft-deleted record disappears from the UI immediately. See [[Sync-Protocol]].
 */
export async function softDeleteBean(id: string): Promise<void> {
	await exec('UPDATE beans SET deleted = 1, dirty = 1, updated_at = ? WHERE id = ?', [Date.now(), id]);
}

export async function softDeleteBrew(id: string): Promise<void> {
	await exec('UPDATE brews SET deleted = 1, dirty = 1, updated_at = ? WHERE id = ?', [Date.now(), id]);
}

export async function softDeleteGrinder(id: string): Promise<void> {
	await exec('UPDATE grinders SET deleted = 1, dirty = 1, updated_at = ? WHERE id = ?', [Date.now(), id]);
}
