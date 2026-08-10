const MAX_INPUT_BYTES = 15 * 1024 * 1024;
const MAX_DIMENSION = 1600;
const OUTPUT_QUALITY = 0.82;

export async function prepareBeanPhoto(file: File): Promise<Blob> {
	if (!file.type.startsWith('image/')) throw new Error('Choose an image file.');
	if (file.size > MAX_INPUT_BYTES) throw new Error('Choose an image smaller than 15 MB.');

	const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
	try {
		const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
		const width = Math.max(1, Math.round(bitmap.width * scale));
		const height = Math.max(1, Math.round(bitmap.height * scale));
		const canvas = document.createElement('canvas');
		canvas.width = width;
		canvas.height = height;
		const context = canvas.getContext('2d');
		if (!context) throw new Error('Photo processing is unavailable in this browser.');
		context.drawImage(bitmap, 0, 0, width, height);

		return await new Promise<Blob>((resolve, reject) => {
			canvas.toBlob(
				(blob) => blob ? resolve(blob) : reject(new Error('Could not process this photo.')),
				'image/webp',
				OUTPUT_QUALITY
			);
		});
	} finally {
		bitmap.close();
	}
}
