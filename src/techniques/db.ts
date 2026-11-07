/** IndexedDB storage for Mika's technique content: records and the media files' bytes. */
import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { TechniqueRecord } from './types';

interface TechniqueDb extends DBSchema {
  records: { key: string; value: TechniqueRecord };
  blobs: { key: string; value: { id: string; blob: Blob } };
}

let dbPromise: Promise<IDBPDatabase<TechniqueDb>> | null = null;

function db(): Promise<IDBPDatabase<TechniqueDb>> {
  dbPromise ??= openDB<TechniqueDb>('mika-techniques', 1, {
    upgrade(database) {
      database.createObjectStore('records', { keyPath: 'id' });
      database.createObjectStore('blobs', { keyPath: 'id' });
    },
  });
  return dbPromise;
}

export async function readAllRecords(): Promise<TechniqueRecord[]> {
  return (await db()).getAll('records');
}

export async function writeRecord(record: TechniqueRecord): Promise<void> {
  await (await db()).put('records', record);
}

export async function deleteStoredRecord(id: string): Promise<void> {
  await (await db()).delete('records', id);
}

export async function readBlob(id: string): Promise<Blob | undefined> {
  return (await (await db()).get('blobs', id))?.blob;
}

export async function writeBlob(id: string, blob: Blob): Promise<void> {
  await (await db()).put('blobs', { id, blob });
}

export async function deleteBlob(id: string): Promise<void> {
  await (await db()).delete('blobs', id);
}
