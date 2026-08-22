export type StoredPhotoLoader = (beanId: string) => Promise<Blob | null>;

/** Resolve bytes for the AI request without fetching the UI's blob: preview
 * URL. A blob URL is a display handle, not a persistence or transport API. */
export async function extractionImage(
	pendingPhoto: Blob | null,
	beanId: string | null,
	loadStoredPhoto: StoredPhotoLoader
): Promise<Blob | null> {
	if (pendingPhoto) return pendingPhoto;
	if (!beanId) return null;
	return loadStoredPhoto(beanId);
}
