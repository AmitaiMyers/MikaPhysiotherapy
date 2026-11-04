import { loadFileBytes, saveFileBytes, saveRecord } from './vault';
import { newId, nowIso } from './records';
import type { Attachment } from './types';

const MAX_IMAGE_SIDE = 2000;

/** Large photos are scaled down (longest side 2000 px, JPEG) to keep the vault small. */
async function preparedBytes(file: File): Promise<{ data: Uint8Array; mimeType: string }> {
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

export async function addAttachment(file: File, patientId: string, episodeId: string | null): Promise<void> {
  const id = newId();
  const { data, mimeType } = await preparedBytes(file);
  await saveFileBytes(id, data);
  const attachment: Attachment = { id, patientId, episodeId, name: file.name, mimeType, size: data.length, note: '', createdAt: nowIso() };
  saveRecord('attachment', attachment);
}

/** Decrypt an attachment into an object URL; the caller revokes it. */
export async function attachmentUrl(attachment: Attachment): Promise<string> {
  const data = await loadFileBytes(attachment.id);
  return URL.createObjectURL(new Blob([new Uint8Array(data)], { type: attachment.mimeType }));
}

export function formatSize(bytes: number): string {
  return bytes < 1_000_000 ? `${Math.round(bytes / 1000)} kB` : `${(bytes / 1_000_000).toFixed(1)} MB`;
}
