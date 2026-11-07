/**
 * The patient vault: unlock with the PIN (or biometric), decrypt every record into memory, and
 * encrypt each change before it is written to IndexedDB. Locking forgets the key and the data.
 */
import { useSyncExternalStore } from 'react';
import { assert, required } from '../domain/assert';
import { biometricSecret, enrolBiometric } from './biometric';
import { generateDataKey, keyFromPin, keyFromSecret, MIN_PIN_LENGTH, openBytes, openJson, randomBytes, sealBytes, sealJson, unwrapDataKey, wrapDataKey } from './crypto';
import { deleteStoredFile, deleteStoredRecord, eraseAll, readAllRecords, readFile, readMeta, recordKey, writeFile, writeMeta, writeRecord, type VaultMeta } from './db';
import { upgradeRecord } from './migrate';
import { RECORD_KINDS, type RecordKind, type RecordTypes } from './types';
import { clearSaveError, trackWrite } from '../feedback/store';

export type VaultStatus = 'loading' | 'empty' | 'locked' | 'unlocked';

interface VaultState {
  status: VaultStatus;
  meta: VaultMeta | null;
  /** Last failed write, shown to the user so no change is lost silently. */
  storageError: string | null;
}

type Collections = { [K in RecordKind]: Map<string, RecordTypes[K]> };

let state: VaultState = { status: 'loading', meta: null, storageError: null };
let dataKey: CryptoKey | null = null;
let collections: Collections = emptyCollections();
/** Cached arrays so React receives the same snapshot until a collection changes. */
let snapshots: { [K in RecordKind]: RecordTypes[K][] } = emptySnapshots();
const listeners = new Set<() => void>();

function emptyCollections(): Collections {
  return Object.fromEntries(RECORD_KINDS.map((kind) => [kind, new Map()])) as unknown as Collections;
}

function emptySnapshots(): { [K in RecordKind]: RecordTypes[K][] } {
  return Object.fromEntries(RECORD_KINDS.map((kind) => [kind, []])) as unknown as { [K in RecordKind]: RecordTypes[K][] };
}

function notify(): void {
  for (const listener of listeners) listener();
}

function setState(patch: Partial<VaultState>): void {
  state = { ...state, ...patch };
  notify();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function refreshSnapshot<K extends RecordKind>(kind: K): void {
  snapshots = { ...snapshots, [kind]: [...collections[kind].values()] };
}

function reportStorageError(error: unknown): void {
  setState({ storageError: error instanceof Error ? error.message : String(error) });
}

function currentKey(): CryptoKey {
  return required(dataKey, 'The vault is locked');
}

// ---------- status ----------

/** Read the vault metadata once at start-up. */
export async function initVault(): Promise<void> {
  const meta = await readMeta();
  setState({ status: meta === undefined ? 'empty' : 'locked', meta: meta ?? null });
}

export const useVaultState = (): VaultState => useSyncExternalStore(subscribe, () => state);

async function loadRecords(key: CryptoKey, meta: VaultMeta): Promise<void> {
  const loaded = emptyCollections();
  for (const stored of await readAllRecords()) {
    const value = upgradeRecord(stored.kind, await openJson<Record<string, unknown>>(key, stored)) as { id: string };
    (loaded[stored.kind] as Map<string, unknown>).set(value.id, value);
  }
  dataKey = key;
  collections = loaded;
  snapshots = emptySnapshots();
  for (const kind of RECORD_KINDS) refreshSnapshot(kind);
  setState({ status: 'unlocked', meta, storageError: null });
}

/** Create a new, empty vault protected by the PIN. */
export async function createVault(pin: string): Promise<void> {
  assert(pin.length >= MIN_PIN_LENGTH, `PIN must have at least ${MIN_PIN_LENGTH} digits`);
  const key = await generateDataKey();
  const pinSalt = randomBytes(16);
  const meta: VaultMeta = { pinSalt, pinWrapped: await wrapDataKey(key, await keyFromPin(pin, pinSalt)), biometric: null, lastBackupAt: null, createdAt: new Date().toISOString() };
  await writeMeta(meta);
  await loadRecords(key, meta);
}

/** Returns false for a wrong PIN. */
export async function unlockWithPin(pin: string): Promise<boolean> {
  const meta = required(state.meta, 'No vault to unlock');
  // A wrong key makes AES-GCM authentication fail; that is the expected "wrong PIN" outcome.
  const key = await unwrapDataKey(meta.pinWrapped, await keyFromPin(pin, meta.pinSalt)).catch(() => null);
  if (key === null) return false;
  await loadRecords(key, meta);
  return true;
}

export async function unlockWithBiometric(): Promise<void> {
  const meta = required(state.meta, 'No vault to unlock');
  const biometric = required(meta.biometric, 'Biometric unlock is not set up');
  const secret = await biometricSecret(biometric.credentialId, biometric.salt);
  const key = await unwrapDataKey(biometric.wrapped, await keyFromSecret(secret, biometric.salt));
  await loadRecords(key, meta);
}

export function lockVault(): void {
  if (state.status !== 'unlocked') return;
  // Writes cannot be retried without the key; the failure stays reported until the next unlock.
  failedWrites.clear();
  dataKey = null;
  collections = emptyCollections();
  snapshots = emptySnapshots();
  setState({ status: 'locked' });
}

/** The raw data key, recovered with the PIN so it can be re-wrapped; null for a wrong PIN. */
async function rawKeyForPin(meta: VaultMeta, pin: string): Promise<Uint8Array | null> {
  // A wrong key makes AES-GCM authentication fail; that is the expected "wrong PIN" outcome.
  return openBytes(await keyFromPin(pin, meta.pinSalt), meta.pinWrapped).catch(() => null);
}

/** Re-wrap the same data key with a new PIN; records do not need re-encrypting. */
export async function changePin(oldPin: string, newPin: string): Promise<boolean> {
  assert(newPin.length >= MIN_PIN_LENGTH, `PIN must have at least ${MIN_PIN_LENGTH} digits`);
  const meta = required(state.meta, 'No vault');
  const raw = await rawKeyForPin(meta, oldPin);
  if (raw === null) return false;
  const pinSalt = randomBytes(16);
  const next: VaultMeta = { ...meta, pinSalt, pinWrapped: await sealBytes(await keyFromPin(newPin, pinSalt), raw) };
  await writeMeta(next);
  setState({ meta: next });
  return true;
}

/** Set up fingerprint/face unlock; needs the PIN to recover the data key for re-wrapping. */
export async function enableBiometric(pin: string): Promise<boolean> {
  const meta = required(state.meta, 'No vault');
  const raw = await rawKeyForPin(meta, pin);
  if (raw === null) return false;
  const salt = randomBytes(32);
  const { credentialId, secret } = await enrolBiometric(salt);
  const wrapped = await sealBytes(await keyFromSecret(secret, salt), raw);
  const next: VaultMeta = { ...meta, biometric: { credentialId, salt, wrapped } };
  await writeMeta(next);
  setState({ meta: next });
  return true;
}

export async function disableBiometric(): Promise<void> {
  const next: VaultMeta = { ...required(state.meta, 'No vault'), biometric: null };
  await writeMeta(next);
  setState({ meta: next });
}

export async function markBackedUp(): Promise<void> {
  const next: VaultMeta = { ...required(state.meta, 'No vault'), lastBackupAt: new Date().toISOString() };
  await writeMeta(next);
  setState({ meta: next });
}

/** After restoring a backup the vault is locked with the backup's PIN. */
export async function reloadAfterRestore(): Promise<void> {
  dataKey = null;
  collections = emptyCollections();
  snapshots = emptySnapshots();
  await initVault();
}

export async function eraseVault(): Promise<void> {
  await eraseAll();
  dataKey = null;
  collections = emptyCollections();
  snapshots = emptySnapshots();
  setState({ status: 'empty', meta: null, storageError: null });
}

// ---------- records ----------

export function useRecords<K extends RecordKind>(kind: K): RecordTypes[K][] {
  return useSyncExternalStore(subscribe, () => snapshots[kind]);
}

export function getRecord<K extends RecordKind>(kind: K, id: string): RecordTypes[K] | undefined {
  return collections[kind].get(id);
}

export function listRecords<K extends RecordKind>(kind: K): RecordTypes[K][] {
  return snapshots[kind];
}

/** Writes that failed, by record key, so they can be retried from the save status. */
const failedWrites = new Map<string, () => void>();

/** Run a storage write, show it in the save status, and remember how to retry it if it fails. */
function track(recordKeyOf: string, write: Promise<unknown>, retry: () => void): void {
  trackWrite(write);
  write.then(
    () => failedWrites.delete(recordKeyOf),
    (error: unknown) => {
      failedWrites.set(recordKeyOf, retry);
      reportStorageError(error);
    },
  );
}

/** Try every failed write again (the latest value of each record). */
export function retryFailedWrites(): void {
  const retries = [...failedWrites.values()];
  failedWrites.clear();
  clearSaveError();
  setState({ storageError: null });
  for (const retry of retries) retry();
}

/** Update memory straight away, then encrypt and store; a failed write is reported in the UI. */
export function saveRecord<K extends RecordKind>(kind: K, value: RecordTypes[K]): void {
  const key = currentKey();
  collections[kind].set(value.id, value);
  refreshSnapshot(kind);
  notify();
  const storeKey = recordKey(kind, value.id);
  track(
    storeKey,
    sealJson(key, value).then((sealed) => writeRecord({ key: storeKey, kind, ...sealed })),
    () => saveRecord(kind, value),
  );
}

export function deleteRecord(kind: RecordKind, id: string): void {
  currentKey();
  collections[kind].delete(id);
  refreshSnapshot(kind);
  notify();
  const storeKey = recordKey(kind, id);
  track(storeKey, deleteStoredRecord(storeKey), () => deleteRecord(kind, id));
}

// ---------- files (attachments) ----------

export async function saveFileBytes(id: string, data: Uint8Array): Promise<void> {
  await writeFile({ id, ...(await sealBytes(currentKey(), data)) });
}

export async function loadFileBytes(id: string): Promise<Uint8Array> {
  const stored = required(await readFile(id), `Missing file ${id}`);
  return openBytes(currentKey(), stored);
}

export function deleteFileBytes(id: string): void {
  void deleteStoredFile(id).catch(reportStorageError);
}

// ---------- auto-lock ----------

const HIDDEN_LOCK_MS = 5 * 60 * 1000;
const IDLE_LOCK_MS = 15 * 60 * 1000;

/** Lock after 5 minutes in the background or 15 minutes without interaction. */
export function startAutoLock(): () => void {
  let hiddenAt: number | null = null;
  let lastActivity = Date.now();
  const onVisibility = () => {
    if (document.visibilityState === 'hidden') {
      hiddenAt = Date.now();
      return;
    }
    if (hiddenAt !== null && Date.now() - hiddenAt > HIDDEN_LOCK_MS) lockVault();
    hiddenAt = null;
    lastActivity = Date.now();
  };
  const onActivity = () => {
    lastActivity = Date.now();
  };
  const timer = window.setInterval(() => {
    if (Date.now() - lastActivity > IDLE_LOCK_MS) lockVault();
  }, 30_000);
  document.addEventListener('visibilitychange', onVisibility);
  window.addEventListener('pointerdown', onActivity);
  window.addEventListener('keydown', onActivity);
  return () => {
    window.clearInterval(timer);
    document.removeEventListener('visibilitychange', onVisibility);
    window.removeEventListener('pointerdown', onActivity);
    window.removeEventListener('keydown', onActivity);
  };
}
