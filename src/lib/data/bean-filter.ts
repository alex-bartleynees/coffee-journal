import type { Bean } from './types';

export type BeanFilter = 'all' | 'active' | 'upcoming' | 'finished';

export function beanStatus(bean: Pick<Bean, 'finished' | 'upcoming'>): Exclude<BeanFilter, 'all'> {
	return bean.finished ? 'finished' : bean.upcoming ? 'upcoming' : 'active';
}

export function storedBeanFilter(value: string | null): BeanFilter {
	return value === 'upcoming' || value === 'active' || value === 'finished' ? value : 'all';
}
