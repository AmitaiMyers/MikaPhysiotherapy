import { loadFileBytes, saveFileBytes, saveRecord } from './vault';
import { newId, nowIso } from './records';
import type { Attachment } from './types';
import { preparedBytes } from '../domain/uploads';

export { formatSize } from '../domain/uploads';

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
