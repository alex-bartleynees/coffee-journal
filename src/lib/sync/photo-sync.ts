import { Schema } from 'effect';
import {
	applyRemoteBeanPhoto,
	clearBeanPhotoDirty,
	getBeanPhotoSyncRows,
	getDirtyBeanPhotos
} from '$lib/db/queries';

const PhotoMetadata = Schema.Struct({
	beanId: Schema.String,
	updatedAt: Schema.Number,
	deleted: Schema.Boolean,
	mimeType: Schema.NullOr(Schema.String)
});
const PhotoManifest = Schema.Struct({ photos: Schema.Array(PhotoMetadata) });
const PhotoMutationResponse = Schema.Struct({ applied: Schema.Boolean, photo: PhotoMetadata });

export type PhotoMetadata = typeof PhotoMetadata.Type;

export type LocalPhotoMetadata = { updatedAt: number; dirty: boolean; deleted: boolean };
export type PhotoReconciliationAction = 'push' | 'pull' | 'delete-local' | 'none';

/** Pure reconciliation rule. Equal dirty timestamps choose the server so two
 * devices converge deterministically after the server rejects an equal write. */
export function photoReconciliationAction(
	local: LocalPhotoMetadata | null,
	remote: PhotoMetadata | null
): PhotoReconciliationAction {
	if (!remote) return local?.dirty ? 'push' : 'none';
	if (!local) return remote.deleted ? 'delete-local' : 'pull';
	if (local.updatedAt > remote.updatedAt) return local.dirty ? 'push' : 'none';
	if (local.updatedAt < remote.updatedAt || local.dirty) return remote.deleted ? 'delete-local' : 'pull';
	return 'none';
}

export async function syncPhotos(options: {
	endpoint: string;
	headers: () => Promise<Record<string, string>>;
	credentials?: RequestCredentials;
}): Promise<number> {
	const request = async (path: string, init: RequestInit = {}) => {
		const response = await fetch(`${options.endpoint}${path}`, {
			...init,
			headers: { ...(await options.headers()), ...(init.headers ?? {}) },
			...(options.credentials ? { credentials: options.credentials } : {})
		});
		if (!response.ok) throw new Error(`photo sync failed: HTTP ${response.status}`);
		return response;
	};

	for (const local of await getDirtyBeanPhotos()) {
		const path = `/${encodeURIComponent(local.bean_id)}`;
		const response = local.deleted
			? await request(path, { method: 'DELETE', headers: { 'x-photo-updated-at': String(local.updated_at) } })
			: await request(path, {
				method: 'PUT',
				headers: { 'content-type': local.mime_type, 'x-photo-updated-at': String(local.updated_at) },
				body: new Blob([new Uint8Array(local.image_data!).buffer], { type: local.mime_type })
			});
		const result = Schema.decodeUnknownSync(PhotoMutationResponse)(await response.json());
		if (result.applied) await clearBeanPhotoDirty(local.bean_id, local.updated_at);
	}

	const manifest = Schema.decodeUnknownSync(PhotoManifest)(await (await request('')).json());
	const localByBean = new Map((await getBeanPhotoSyncRows()).map((photo) => [photo.bean_id, photo]));
	let applied = 0;
	for (const remote of manifest.photos) {
		const local = localByBean.get(remote.beanId);
		const action = photoReconciliationAction(
			local ? { updatedAt: local.updated_at, dirty: !!local.dirty, deleted: !!local.deleted } : null,
			remote
		);
		if (action === 'none' || action === 'push') continue;
		if (action === 'delete-local') {
			if (await applyRemoteBeanPhoto(remote.beanId, remote.updatedAt, true, null, null)) applied += 1;
			continue;
		}
		const response = await request(`/${encodeURIComponent(remote.beanId)}`);
		const bytes = new Uint8Array(await response.arrayBuffer());
		if (await applyRemoteBeanPhoto(remote.beanId, remote.updatedAt, false, remote.mimeType, bytes)) applied += 1;
	}
	return applied;
}
