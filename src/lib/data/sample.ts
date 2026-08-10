import type { Bean, Brew, Grinder, Method } from './types';
import { calendarDate } from './date';

export const SAMPLE_BEANS: Bean[] = [
	{
		id: 'b1',
		name: 'Suke Quto',
		roaster: 'Onyx Coffee Lab',
		origin: 'Ethiopia, Guji',
		process: 'Natural',
		varietal: 'Heirloom',
		roast: 'light',
		altitude: '1900–2200m',
		tasting: ['Blueberry', 'Jasmine', 'Cocoa nib'],
		dateOpened: calendarDate('2026-04-18'),
		roastDate: calendarDate('2026-04-08'),
		pricePerKg: 84,
		bagWeight: 250,
		brews: 7
	},
	{
		id: 'b2',
		name: 'Decaf Colombia',
		roaster: 'Square Mile',
		origin: 'Colombia, Huila',
		process: 'Sugarcane EA',
		varietal: 'Caturra',
		roast: 'medium',
		altitude: '1700m',
		tasting: ['Caramel', 'Hazelnut', 'Red apple'],
		dateOpened: calendarDate('2026-04-10'),
		roastDate: calendarDate('2026-04-02'),
		pricePerKg: 56,
		bagWeight: 250,
		brews: 11
	},
	{
		id: 'b3',
		name: 'House Espresso №7',
		roaster: 'Sey',
		origin: 'Brazil + Ethiopia',
		process: 'Blend',
		varietal: 'Various',
		roast: 'medium',
		altitude: '—',
		tasting: ['Milk chocolate', 'Toffee', 'Orange peel'],
		dateOpened: calendarDate('2026-04-22'),
		roastDate: calendarDate('2026-04-15'),
		pricePerKg: 48,
		bagWeight: 1000,
		brews: 4
	},
	{
		id: 'b4',
		name: 'Las Lajas Perla Negra',
		roaster: 'April',
		origin: 'Costa Rica',
		process: 'Black Honey',
		varietal: 'Caturra/Catuai',
		roast: 'light',
		altitude: '1600m',
		tasting: ['Stone fruit', 'Honey', 'Maple'],
		dateOpened: calendarDate('2026-03-30'),
		roastDate: calendarDate('2026-03-22'),
		pricePerKg: 92,
		bagWeight: 250,
		brews: 14,
		finished: true
	}
];

export const SAMPLE_GRINDERS: Grinder[] = [
	{
		id: 'g1',
		name: 'Niche Zero',
		maker: 'Niche',
		range: [0, 50],
		step: 0.1,
		type: 'espresso',
		burr: 'Conical 63mm',
		rpm: 330,
		notes: 'Workhorse. Espresso 12–16, AeroPress 25–30.',
		presets: [
			{ method: 'espresso', setting: 14.5 },
			{ method: 'aeropress', setting: 28 }
		]
	},
	{
		id: 'g2',
		name: 'Comandante C40',
		maker: 'Comandante',
		range: [0, 40],
		step: 1,
		type: 'pourover',
		burr: 'Nitro Blade steel',
		rpm: null,
		notes: 'Travel + filter. V60 around 22–24 clicks.',
		presets: [
			{ method: 'v60', setting: 22 },
			{ method: 'aeropress', setting: 18 }
		]
	},
	{
		id: 'g3',
		name: 'DF64 Gen 2',
		maker: 'DF',
		range: [0, 90],
		step: 1,
		type: 'espresso',
		burr: 'SSP MP 64mm',
		rpm: 1350,
		notes: 'Single dose. Bypass mod installed Mar 2026.',
		presets: [{ method: 'espresso', setting: 32 }]
	}
];

export const SAMPLE_BREWS: Brew[] = [
	{
		id: 'br1',
		beanId: 'b1',
		method: 'v60',
		date: calendarDate('2026-04-28'),
		time: '08:14',
		grinder: 'g2',
		grindSetting: 22,
		doseIn: 15,
		yieldOut: 250,
		extractionTime: 178,
		temperature: 94,
		ratio: '1:16.7',
		rating: 8.5,
		rating2: null,
		aroma: 'Bright florals, fresh blueberry, a hint of bergamot',
		flavor: 'Wild blueberry pops first, then jasmine and cocoa nib in the finish. Tea-like body.',
		body: 'Light, juicy, syrupy on cooldown',
		finish: 'Long, sweet, lingering florals',
		descriptors: ['Blueberry', 'Jasmine', 'Cocoa', 'Bright', 'Juicy'],
		favorite: true
	},
	{
		id: 'br2',
		beanId: 'b3',
		method: 'espresso',
		date: calendarDate('2026-04-27'),
		time: '07:42',
		grinder: 'g1',
		grindSetting: 14.5,
		doseIn: 18,
		yieldOut: 36,
		extractionTime: 28,
		temperature: 93,
		ratio: '1:2',
		rating: 7,
		rating2: 8,
		withMilk: true,
		aroma: 'Rich chocolate, baking spices',
		flavor: 'Milk chocolate dominant, toffee mid-palate, faint orange peel on the finish',
		body: 'Full, syrupy, rounded',
		finish: 'Clean, slightly drying',
		cutsThruMilk: true,
		descriptors: ['Chocolate', 'Toffee', 'Orange peel', 'Round', 'Sweet']
	},
	{
		id: 'br3',
		beanId: 'b2',
		method: 'espresso',
		date: calendarDate('2026-04-27'),
		time: '20:10',
		grinder: 'g1',
		grindSetting: 13.2,
		doseIn: 18,
		yieldOut: 38,
		extractionTime: 31,
		temperature: 92,
		ratio: '1:2.1',
		rating: 7.5,
		rating2: 8.5,
		withMilk: true,
		aroma: 'Caramel, hazelnut praline',
		flavor: 'Soft and sweet — caramel and hazelnut. Apple acidity peeks through',
		body: 'Medium, creamy',
		finish: 'Sweet, nutty',
		cutsThruMilk: true,
		descriptors: ['Caramel', 'Hazelnut', 'Apple', 'Sweet', 'Nutty']
	},
	{
		id: 'br4',
		beanId: 'b1',
		method: 'v60',
		date: calendarDate('2026-04-26'),
		time: '08:30',
		grinder: 'g2',
		grindSetting: 21,
		doseIn: 15,
		yieldOut: 250,
		extractionTime: 165,
		temperature: 94,
		ratio: '1:16.7',
		rating: 7,
		aroma: 'Floral but muted',
		flavor: 'Blueberry present but subdued, slight grassiness',
		body: 'Tea-like, thin',
		finish: 'Short',
		descriptors: ['Blueberry', 'Floral', 'Grassy']
	},
	{
		id: 'br5',
		beanId: 'b3',
		method: 'aeropress',
		date: calendarDate('2026-04-25'),
		time: '14:22',
		grinder: 'g2',
		grindSetting: 18,
		doseIn: 17,
		yieldOut: 220,
		extractionTime: 90,
		temperature: 88,
		ratio: '1:13',
		rating: 8,
		aroma: 'Cocoa, caramel',
		flavor: 'Chocolate-forward, sweet, easy drinking. Lower acidity at this temp',
		body: 'Medium-full',
		finish: 'Sweet, chocolatey',
		descriptors: ['Chocolate', 'Caramel', 'Sweet', 'Round']
	}
];

export const TASTE_DESCRIPTORS: Record<string, string[]> = {
	Fruit: ['Blueberry', 'Strawberry', 'Cherry', 'Raspberry', 'Apple', 'Stone fruit', 'Citrus', 'Tropical', 'Grape'],
	Floral: ['Jasmine', 'Bergamot', 'Rose', 'Honeysuckle', 'Earl grey'],
	Sweet: ['Caramel', 'Honey', 'Maple', 'Brown sugar', 'Toffee', 'Vanilla'],
	Nutty: ['Hazelnut', 'Almond', 'Walnut', 'Peanut'],
	Cocoa: ['Milk chocolate', 'Dark chocolate', 'Cocoa nib', 'Mocha'],
	Spice: ['Cinnamon', 'Clove', 'Black pepper', 'Cardamom'],
	Other: ['Tobacco', 'Earthy', 'Woody', 'Smoky', 'Grassy', 'Herbal']
};

export const METHOD_LABELS: Record<Method, string> = {
	espresso: 'Espresso',
	v60: 'V60',
	aeropress: 'AeroPress'
};

export function beanById(beans: Bean[]): Record<string, Bean> {
	return Object.fromEntries(beans.map((b) => [b.id, b]));
}

export function grinderById(grinders: Grinder[]): Record<string, Grinder> {
	return Object.fromEntries(grinders.map((g) => [g.id, g]));
}

export function formatExtractionTime(seconds: number): string {
	const m = Math.floor(seconds / 60);
	const s = Math.round(seconds % 60);
	return `${m}:${String(s).padStart(2, '0')}`;
}
