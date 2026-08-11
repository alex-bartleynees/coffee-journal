import { describe, expect, it } from 'vitest';
import { photoReconciliationAction, type PhotoMetadata } from './photo-sync';

const remote = (updatedAt: number, deleted = false): PhotoMetadata => ({
	beanId: 'bean-1', updatedAt, deleted, mimeType: deleted ? null : 'image/webp'
});

describe('photo reconciliation', () => {
	it('uploads a photo created before the user subscribed when the server has none', () => {
		expect(photoReconciliationAction({ updatedAt: 100, dirty: true, deleted: false }, null)).toBe('push');
	});

	it('downloads a server photo onto a second device', () => {
		expect(photoReconciliationAction(null, remote(100))).toBe('pull');
	});

	it('uses last-write-wins in both directions', () => {
		expect(photoReconciliationAction({ updatedAt: 200, dirty: true, deleted: false }, remote(100))).toBe('push');
		expect(photoReconciliationAction({ updatedAt: 100, dirty: true, deleted: false }, remote(200))).toBe('pull');
	});

	it('applies a newer deletion tombstone instead of resurrecting the photo', () => {
		expect(photoReconciliationAction({ updatedAt: 100, dirty: false, deleted: false }, remote(200, true))).toBe('delete-local');
	});

	it('chooses the server deterministically when equal timestamps conflict', () => {
		expect(photoReconciliationAction({ updatedAt: 100, dirty: true, deleted: false }, remote(100))).toBe('pull');
	});
});
