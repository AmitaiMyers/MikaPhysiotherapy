/**
 * Raw IndexedDB storage for the patient vault. Everything stored here is already encrypted,
 * except the vault metadata (salts, wrapped keys and the last backup time).
 */
import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { Sealed } from './crypto';
import type { RecordKind } from './types';

export interface BiometricMeta {
  credentialId: Uint8Array;
  salt: Uint8Array;
  wrapped: Sealed;
}

export interface VaultMeta {
  pinSalt: Uint8Array;
  pinWrapped: Sealed;
  biometric: BiometricMeta | null;
  /** ISO date-time of the last backup file, or null. */
  lastBackupAt: string | null;
  createdAt: string;
}

export interface StoredRecord extends Sealed {
  /** `${kind}:${id}` */
  key: string;
  kind: RecordKind;
}

export interface StoredFile extends Sealed {
  id: string;
}

interface VaultDb extends DBSchema {
  meta: { key: string; value: VaultMeta };
  records: { key: string; value: StoredRecord };
  files: { key: string; value: StoredFile };
}

const DB_NAME = 'mika-patients';
const DB_VERSION = 1;
const META_KEY = 'vault';

let dbPromise: Promise<IDBPDatabase<VaultDb>> | null = null;

function db(): Promise<IDBPDatabase<VaultDb>> {
  dbPromise ??= openDB<VaultDb>(DB_NAME, DB_VERSION, {
    upgrade(database) {
      database.createObjectStore('meta');
      database.createObjectStore('records', { keyPath: 'key' });
      database.createObjectStore('files', { keyPath: 'id' });
    },
  });
  return dbPromise;
}

export const recordKey = (kind: RecordKind, id: string) => `${kind}:${id}`;

export async function readMeta(): Promise<VaultMeta | undefined> {
  return (await db()).get('meta', META_KEY);
}

export async function writeMeta(meta: VaultMeta): Promise<void> {
  await (await db()).put('meta', meta, META_KEY);
}

export async function readAllRecords(): Promise<StoredRecord[]> {
  return (await db()).getAll('records');
}

export async function writeRecord(record: StoredRecord): Promise<void> {
  await (await db()).put('records', record);
}

export async function deleteStoredRecord(key: string): Promise<void> {
  await (await db()).delete('records', key);
}

export async function readFile(id: string): Promise<StoredFile | undefined> {
  return (await db()).get('files', id);
}

export async function readAllFiles(): Promise<StoredFile[]> {
  return (await db()).getAll('files');
}

export async function writeFile(file: StoredFile): Promise<void> {
  await (await db()).put('files', file);
}

export async function deleteStoredFile(id: string): Promise<void> {
  await (await db()).delete('files', id);
}

/** Replace the whole vault in one transaction (restoring a backup). */
export async function replaceAll(meta: VaultMeta, records: StoredRecord[], files: StoredFile[]): Promise<void> {
  const database = await db();
  const tx = database.transaction(['meta', 'records', 'files'], 'readwrite');
  await Promise.all([tx.objectStore('records').clear(), tx.objectStore('files').clear()]);
  await Promise.all([
    tx.objectStore('meta').put(meta, META_KEY),
    ...records.map((record) => tx.objectStore('records').put(record)),
    ...files.map((file) => tx.objectStore('files').put(file)),
  ]);
  await tx.done;
}

/** Delete everything (forgotten PIN, starting again). */
export async function eraseAll(): Promise<void> {
  const database = await db();
  const tx = database.transaction(['meta', 'records', 'files'], 'readwrite');
  await Promise.all([tx.objectStore('meta').clear(), tx.objectStore('records').clear(), tx.objectStore('files').clear()]);
  await tx.done;
}
