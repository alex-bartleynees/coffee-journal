export type Roast = 'light' | 'medium' | 'dark';
export type Method = 'espresso' | 'v60' | 'aeropress';
export type GrinderType = 'espresso' | 'pourover';

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
	dateOpened: string;
	roastDate: string;
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
	date: string;
	time: string;
	grinder: string;
	grindSetting: number;
	doseIn: number;
	yieldOut: number;
	extractionTime: number;
	temperature: number;
	ratio: string;
	recipeNotes?: string;
	rating: number;
	rating2?: number | null;
	aroma?: string;
	flavor?: string;
	body?: string;
	finish?: string;
	descriptors?: string[];
	withMilk?: boolean;
	cutsThruMilk?: boolean;
	buyAgain?: 'Yes' | 'Maybe' | 'No' | null;
	bestFor?: 'Daily driver' | 'Occasional' | 'Skip' | null;
	favorite?: boolean;
}
