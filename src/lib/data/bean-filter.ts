export type BeanFilter = 'all' | 'active' | 'finished';

export function storedBeanFilter(value: string | null): BeanFilter {
	return value === 'active' || value === 'finished' ? value : 'all';
}
