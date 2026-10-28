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

export interface RecipeStep {
	id: string;
	label: string;
	/** Cumulative seconds from the start of the guided brew. */
	time: number;
	/** Optional cumulative water/yield target in grams. */
	water?: number;
}

export interface Recipe {
	id: string;
	methodId: string;
	name: string;
	beanId?: string;
	doseIn: number;
	yieldOut: number;
	temperature: number;
	grind?: string;
	targetTime: number;
	notes?: string;
	steps: RecipeStep[];
}

/**
 * A numeric setting a machine exposes per brew (e.g. pre-infusion time/power on
 * a Breville Dual Boiler). Defined on the machine, offered on the Brew step.
 */
export interface MachineBrewOption {
	id: string;
	label: string;
	unit?: string;
	min: number;
	max: number;
	step: number;
	default: number;
}

/**
 * A machine option's value on a brew. Label/unit are copied in so the brew stays
 * a readable snapshot even if the machine's options are later edited or removed.
 */
export interface MachineSetting {
	optionId: string;
	label: string;
	unit?: string;
	value: number;
}

export interface Machine {
	id: string;
	name: string;
	maker: string;
	type: string;
	/** Retired equipment stays in the library and on historical brews, but is unavailable for new brews. */
	retired?: boolean;
	/** Optional — a machine can be added before its method is decided, or reassigned later. */
	method?: string;
	notes?: string;
	/** Per-brew settings offered on the Brew step when this machine is selected. */
	brewOptions?: MachineBrewOption[];
}

/** When a mineral addition goes in: remineralising the brew water, or dosed into the finished cup. */
export type MineralStage = 'brew-water' | 'in-cup';

/**
 * A mineral product a water profile adds (e.g. Apax drops in the cup, a Third
 * Wave sachet in distilled water). Defined on the profile, offered on the Brew step.
 */
export interface MineralAddition {
	id: string;
	product: string;
	/** Free text — "drops", "ml", "g", "sachet"… */
	unit?: string;
	stage: MineralStage;
	min: number;
	max: number;
	step: number;
	default: number;
}

/**
 * A mineral addition's amount on a brew. Product/unit/stage are copied in so the
 * brew stays a readable snapshot even if the profile is later edited or removed.
 */
export interface MineralDose {
	additionId: string;
	product: string;
	unit?: string;
	stage: MineralStage;
	amount: number;
}

export interface WaterProfile {
	id: string;
	name: string;
	/** The water the minerals go into — "Brita filtered tap", "Distilled", a bottled brand. */
	base?: string;
	/** Optional measurements in ppm, for people who test their water. */
	gh?: number;
	kh?: number;
	tds?: number;
	notes?: string;
	/** Retired profiles stay on historical brews, but are unavailable for new brews. */
	retired?: boolean;
	additions: MineralAddition[];
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
	/** Retired equipment stays in the library and on historical brews, but is unavailable for new brews. */
	retired?: boolean;
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
	/** Values for the machine's brew options at the time of the brew. */
	machineSettings?: MachineSetting[];
	/** Water profile used, if any — references a WaterProfile.id. */
	waterProfile?: string;
	/** Amounts of the water profile's mineral additions at the time of the brew. */
	mineralDoses?: MineralDose[];
	grindSetting: number;
	doseIn: number;
	yieldOut: number;
	extractionTime: number;
	temperature: number;
	ratio: string;
	recipeNotes?: string;
	/** Optional provenance only; brew measurements remain an immutable snapshot. */
	recipeId?: string;
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
	/** Final beverage made from an espresso-method brew. Null on legacy/other-method brews. */
	espressoDrink?: EspressoDrink | null;
	cutsThruMilk?: boolean;
	buyAgain?: 'Yes' | 'Maybe' | 'No' | null;
	bestFor?: 'Daily driver' | 'Occasional' | 'Skip' | null;
	favorite?: boolean;
}

export const MILK_DRINKS = ['Flat White', 'Latte', 'Cappuccino', 'Cortado', 'Mocha', 'Other'] as const;
export type MilkDrink = (typeof MILK_DRINKS)[number];
export const BLACK_ESPRESSO_DRINKS = ['Espresso', 'Ristretto', 'Long Black', 'Americano', 'Iced Coffee'] as const;
export type BlackEspressoDrink = (typeof BLACK_ESPRESSO_DRINKS)[number];
export type EspressoDrink = BlackEspressoDrink | MilkDrink;
