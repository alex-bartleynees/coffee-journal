import type { MethodDef } from './types';

export function methodLabel(methods: MethodDef[], id: string): string {
	return methods.find((method) => method.id === id)?.label ?? id;
}

