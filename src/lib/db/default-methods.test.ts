import { describe, expect, it, vi } from 'vitest';
import { DEFAULT_METHODS_MARKER, ensureDefaultMethods } from './default-methods';

const defaults = [{ id: 'espresso', label: 'Espresso', icon: 'espresso' as const }];

describe('ensureDefaultMethods', () => {
	it('bootstraps defaults once for production and upgraded databases', async () => {
		const database = {
			markerExists: vi.fn().mockResolvedValue(false),
			insertIfMissing: vi.fn().mockResolvedValue(undefined),
			setMarker: vi.fn().mockResolvedValue(undefined)
		};

		await ensureDefaultMethods(database, defaults);

		expect(database.insertIfMissing).toHaveBeenCalledWith(defaults[0]);
		expect(database.setMarker).toHaveBeenCalledWith(DEFAULT_METHODS_MARKER);
	});

	it('does not resurrect defaults after initialization', async () => {
		const database = {
			markerExists: vi.fn().mockResolvedValue(true),
			insertIfMissing: vi.fn(),
			setMarker: vi.fn()
		};

		await ensureDefaultMethods(database, defaults);

		expect(database.insertIfMissing).not.toHaveBeenCalled();
		expect(database.setMarker).not.toHaveBeenCalled();
	});
});
