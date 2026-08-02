import type { Method } from '$lib/data/types';

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
