const MAX_IMAGE_SIDE = 2000;

/** Large photos are scaled down (longest side 2000 px, JPEG) to save space; other files are kept as they are. */
export async function preparedBytes(file: File): Promise<{ data: Uint8Array; mimeType: string }> {
  if (!file.type.startsWith('image/')) return { data: new Uint8Array(await file.arrayBuffer()), mimeType: file.type || 'application/octet-stream' };
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_IMAGE_SIDE / Math.max(bitmap.width, bitmap.height));
  if (scale === 1 && file.type === 'image/jpeg') return { data: new Uint8Array(await file.arrayBuffer()), mimeType: file.type };
  const canvas = new OffscreenCanvas(Math.round(bitmap.width * scale), Math.round(bitmap.height * scale));
  const context = canvas.getContext('2d');
  if (context === null) throw new Error('Canvas is not available to resize the photo');
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const blob = await canvas.convertToBlob({ type: 'image/jpeg', quality: 0.85 });
  return { data: new Uint8Array(await blob.arrayBuffer()), mimeType: 'image/jpeg' };
}

export function formatSize(bytes: number): string {
  return bytes < 1_000_000 ? `${Math.round(bytes / 1000)} kB` : `${(bytes / 1_000_000).toFixed(1)} MB`;
}
