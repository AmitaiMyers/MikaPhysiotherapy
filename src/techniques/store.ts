/**
 * Mika's technique content in memory, mirrored to IndexedDB. Loaded once at start-up; every change
 * updates memory first (so the screen reacts at once) and is then written to storage.
 */
import { useSyncExternalStore } from 'react';
import { assert } from '../domain/assert';
import { preparedBytes } from '../domain/uploads';
import { deleteBlob, deleteStoredRecord, readAllRecords, readBlob, writeBlob, writeRecord } from './db';
import type { CustomTechnique, MediaItem, TechniqueNote, TechniqueRecord } from './types';

/** Video files above this size are refused, to keep the device storage in check. */
export const MAX_VIDEO_BYTES = 100 * 1024 * 1024;

export interface TechniqueContent {
  ready: boolean;
  techniques: CustomTechnique[];
  notes: TechniqueNote[];
  media: MediaItem[];
  /** Last failed write, shown so no change is lost silently. */
  storageError: string | null;
}

let state: TechniqueContent = { ready: false, techniques: [], notes: [], media: [], storageError: null };
const records = new Map<string, TechniqueRecord>();
const listeners = new Set<() => void>();

function refresh(patch: Partial<TechniqueContent> = {}): void {
  const all = [...records.values()];
  state = {
    ...state,
    ...patch,
    techniques: all.filter((r): r is CustomTechnique => r.kind === 'technique'),
    notes: all.filter((r): r is TechniqueNote => r.kind === 'note'),
    media: all.filter((r): r is MediaItem => r.kind === 'media'),
  };
  for (const listener of listeners) listener();
}

const reportError = (error: unknown) => refresh({ storageError: error instanceof Error ? error.message : String(error) });

export async function initTechniqueStore(): Promise<void> {
  for (const record of await readAllRecords()) records.set(record.id, record);
  refresh({ ready: true });
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export const useTechniqueContent = (): TechniqueContent => useSyncExternalStore(subscribe, () => state);
export const currentTechniqueContent = (): TechniqueContent => state;

export function saveTechniqueRecord(record: TechniqueRecord): void {
  records.set(record.id, record);
  refresh();
  void writeRecord(record).catch(reportError);
}

function removeRecord(id: string): void {
  records.delete(id);
  refresh();
  void deleteStoredRecord(id).catch(reportError);
}

export function deleteMedia(id: string): void {
  removeRecord(id);
  void deleteBlob(id).catch(reportError);
}

export function deleteNote(note: TechniqueNote): void {
  for (const mediaId of note.mediaIds) deleteMedia(mediaId);
  removeRecord(note.id);
}

/** Delete a custom technique with its notes and media. */
export function deleteCustomTechnique(technique: CustomTechnique): void {
  for (const note of state.notes.filter((n) => n.techniqueId === technique.id)) deleteNote(note);
  for (const mediaId of technique.mediaIds) deleteMedia(mediaId);
  removeRecord(technique.id);
}

/** Store an uploaded photo (scaled down) or video (size-checked) and return its record. */
export async function addMedia(file: File): Promise<MediaItem> {
  assert(file.type.startsWith('image/') || file.type.startsWith('video/'), 'Choose a photo or a video');
  assert(!file.type.startsWith('video/') || file.size <= MAX_VIDEO_BYTES, `Videos must be under ${MAX_VIDEO_BYTES / 1024 / 1024} MB`);
  const { data, mimeType } = await preparedBytes(file);
  const item: MediaItem = { kind: 'media', id: crypto.randomUUID(), name: file.name, mimeType, size: data.length, createdAt: new Date().toISOString() };
  await writeBlob(item.id, new Blob([new Uint8Array(data)], { type: mimeType }));
  saveTechniqueRecord(item);
  return item;
}

/** Store media bytes received in an imported file. */
export async function importMedia(item: MediaItem, blob: Blob): Promise<void> {
  await writeBlob(item.id, blob);
  saveTechniqueRecord(item);
}

export async function mediaBlob(id: string): Promise<Blob> {
  const blob = await readBlob(id);
  assert(blob !== undefined, `Missing media file ${id}`);
  return blob;
}
