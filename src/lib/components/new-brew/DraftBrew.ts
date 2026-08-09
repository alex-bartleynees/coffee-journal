import type { Brew, Method } from '$lib/data/types';

export interface DraftBrew {
	beanId: string;
	method: Method;
	withMilk: boolean;
	grinder: string;
	grindSetting: number;
	doseIn: number;
	yieldOut: number;
	extractionTime: number;
	temperature: number;
	recipeNotes: string;
	aroma: string;
	flavor: string;
	body: string;
	finish: string;
	descriptors: string[];
	rating: number;
	rating2: number | null;
	cutsThruMilk: boolean;
	buyAgain: 'Yes' | 'Maybe' | 'No' | null;
	bestFor: 'Daily driver' | 'Occasional' | 'Skip' | null;
}

export function createDraft(beanId: string): DraftBrew {
	return {
		beanId,
		method: 'espresso',
		withMilk: false,
		grinder: 'g1',
		grindSetting: 14,
		doseIn: 18,
		yieldOut: 36,
		extractionTime: 0,
		temperature: 93,
		recipeNotes: '',
		aroma: '',
		flavor: '',
		body: '',
		finish: '',
		descriptors: [],
		rating: 7,
		rating2: null,
		cutsThruMilk: false,
		buyAgain: null,
		bestFor: null
	};
}

export function draftFromBrew(brew: Brew): DraftBrew {
	return {
		beanId: brew.beanId,
		method: brew.method,
		withMilk: brew.withMilk ?? false,
		grinder: brew.grinder,
		grindSetting: brew.grindSetting,
		doseIn: brew.doseIn,
		yieldOut: brew.yieldOut,
		extractionTime: brew.extractionTime,
		temperature: brew.temperature,
		recipeNotes: brew.recipeNotes ?? '',
		aroma: brew.aroma ?? '',
		flavor: brew.flavor ?? '',
		body: brew.body ?? '',
		finish: brew.finish ?? '',
		descriptors: [...(brew.descriptors ?? [])],
		rating: brew.rating,
		rating2: brew.rating2 ?? null,
		cutsThruMilk: brew.cutsThruMilk ?? false,
		buyAgain: brew.buyAgain ?? null,
		bestFor: brew.bestFor ?? null
	};
}

/**
 * In-progress brew autosave. A brew is only written to SQLite on the final Save,
 * but the tasting flow can span 30+ minutes — so the working draft is mirrored to
 * localStorage on every edit and restored if the tab/PWA reloads mid-flow. This is
 * transient, single-device, must-not-sync UI state, so it lives here and never
 * touches the synced SQLite domain store.
 */
const DRAFT_KEY = 'bloom:draft-brew';

export function loadDraft(): { draft: DraftBrew; tab: number } | null {
	if (typeof localStorage === 'undefined') return null;
	try {
		const raw = localStorage.getItem(DRAFT_KEY);
		if (!raw) return null;
		const parsed = JSON.parse(raw) as { draft?: Partial<DraftBrew>; tab?: number };
		if (!parsed?.draft) return null;
		// Merge over a fresh draft so drafts saved before a field was added stay valid.
		return {
			draft: { ...createDraft(parsed.draft.beanId ?? ''), ...parsed.draft },
			tab: typeof parsed.tab === 'number' ? parsed.tab : 0
		};
	} catch {
		return null;
	}
}

export function saveDraft(draft: DraftBrew, tab: number): void {
	if (typeof localStorage === 'undefined') return;
	try {
		localStorage.setItem(DRAFT_KEY, JSON.stringify({ draft, tab }));
	} catch {
		// Best-effort autosave — ignore quota/availability errors.
	}
}

export function clearDraft(): void {
	if (typeof localStorage === 'undefined') return;
	try {
		localStorage.removeItem(DRAFT_KEY);
	} catch {
		// Ignore — nothing actionable if removal fails.
	}
}
