import { beanById } from '$lib/data/sample';
import { methodLabel } from '$lib/data/methods';
import { espressoDrinkLabel } from '$lib/data/espresso-drinks';
import type { Bean, Brew, Grinder, MethodDef } from '$lib/data/types';

export interface JournalSearchSource {
	beans: Bean[];
	brews: Brew[];
	grinders: Grinder[];
	methods: MethodDef[];
}

export interface JournalSearchResults {
	beans: Bean[];
	brews: Brew[];
}

const DEFAULT_GROUP_LIMIT = 6;

function containsQuery(values: Array<string | undefined>, query: string): boolean {
	return values.some((value) => value?.toLocaleLowerCase().includes(query));
}

export function searchJournal(
	query: string,
	source: JournalSearchSource,
	limit = DEFAULT_GROUP_LIMIT
): JournalSearchResults {
	const normalizedQuery = query.trim().toLocaleLowerCase();
	if (!normalizedQuery) return { beans: [], brews: [] };

	const beans = source.beans
		.filter((bean) =>
			containsQuery(
				[bean.name, bean.roaster, bean.origin, bean.process, bean.varietal, ...bean.tasting],
				normalizedQuery
			)
		)
		.slice(0, limit);

	const beansById = beanById(source.beans);
	const brews = source.brews
		.filter((brew) => {
			const bean = beansById[brew.beanId];
			return containsQuery(
				[
					espressoDrinkLabel(brew) ?? undefined,
					methodLabel(source.methods, brew.method),
					brew.method,
					brew.aroma,
					brew.flavor,
					brew.body,
					brew.finish,
					...(brew.descriptors ?? []),
					bean?.name,
					bean?.roaster
				],
				normalizedQuery
			);
		})
		.slice(0, limit);

	return { beans, brews };
}
