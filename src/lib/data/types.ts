import type { CalendarDate } from './date';
import type { IconName } from '$lib/icons/Icon.svelte';

export type Roast = 'light' | 'medium' | 'dark';
/** References a MethodDef.id. Not a union — methods are user-extensible data, not a fixed set. */
export type Method = string;
export type GrinderType = 'espresso' | 'pourover';

export interface MethodDef {
	id: string;
	label: string;
	/** Falls back to the generic 'cup' icon for custom methods with no dedicated icon. */
	icon: IconName;
	notes?: string;
}

export interface Machine {
	id: string;
	name: string;
	maker: string;
	type: string;
	/** Optional — a machine can be added before its method is decided, or reassigned later. */
	method?: string;
	notes?: string;
}

export interface Bean {
	id: string;
	name: string;
	roaster: string;
	origin: string;
	process: string;
	varietal: string;
	roast: Roast;
	altitude: string;
	tasting: string[];
	dateOpened: CalendarDate;
	roastDate: CalendarDate;
	pricePerKg: number;
	bagWeight: number;
	brews: number;
	finished?: boolean;
	/** Device-local bean-bag photo. Deliberately excluded from the row sync payload. */
	photoUrl?: string;
}

export interface GrinderPreset {
	method: Method;
	setting: number;
}

export interface Grinder {
	id: string;
	name: string;
	maker: string;
	range: [number, number];
	step: number;
	type: GrinderType;
	burr: string;
	rpm: number | null;
	notes?: string;
	presets: GrinderPreset[];
}

export interface Brew {
	id: string;
	beanId: string;
	method: Method;
	date: CalendarDate;
	time: string;
	grinder: string;
	/** Espresso machine / pourover device used, if any — references a Machine.id. */
	machine?: string;
	grindSetting: number;
	doseIn: number;
	yieldOut: number;
	extractionTime: number;
	temperature: number;
	ratio: string;
	recipeNotes?: string;
	/** Null when the brew was logged without a tasting verdict (Quick brew). */
	rating: number | null;
	rating2?: number | null;
	aroma?: string;
	flavor?: string;
	body?: string;
	finish?: string;
	descriptors?: string[];
	withMilk?: boolean;
	milkDrink?: MilkDrink | null;
	cutsThruMilk?: boolean;
	buyAgain?: 'Yes' | 'Maybe' | 'No' | null;
	bestFor?: 'Daily driver' | 'Occasional' | 'Skip' | null;
	favorite?: boolean;
}

export const MILK_DRINKS = ['Flat White', 'Latte', 'Cappuccino', 'Cortado', 'Mocha', 'Other'] as const;
export type MilkDrink = (typeof MILK_DRINKS)[number];
