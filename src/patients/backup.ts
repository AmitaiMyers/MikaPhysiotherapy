/**
 * Backup files hold the vault exactly as stored: metadata plus encrypted records and files.
 * They are useless without the PIN that was set when the backup was made.
 */
import { assert } from '../domain/assert';
import { fromBase64, toBase64 } from './crypto';
import type { StoredFile, StoredRecord, VaultMeta } from './db';

const FORMAT = 'mika-physio-patients-backup';
const VERSION = 1;

export interface VaultDump {
  meta: VaultMeta;
  records: StoredRecord[];
  files: StoredFile[];
}

/** JSON has no binary type: byte arrays become { $b64: "…" }. */
function encode(value: unknown): unknown {
  if (value instanceof Uint8Array) return { $b64: toBase64(value) };
  if (Array.isArray(value)) return value.map(encode);
  if (value !== null && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, encode(v)]));
  return value;
}

function decode(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(decode);
  if (value !== null && typeof value === 'object') {
    const entries = Object.entries(value);
    if (entries.length === 1 && entries[0]?.[0] === '$b64') return fromBase64(String(entries[0][1]));
    return Object.fromEntries(entries.map(([k, v]) => [k, decode(v)]));
  }
  return value;
}

export function serializeBackup(dump: VaultDump, exportedAt: string): string {
  return JSON.stringify({ format: FORMAT, version: VERSION, exportedAt, ...(encode(dump) as object) });
}

/** Throws with a readable message when the file is not a backup of this app. */
export function parseBackup(text: string): VaultDump {
  const parsed = JSON.parse(text) as { format?: unknown; version?: unknown };
  assert(parsed.format === FORMAT, 'This file is not a Mika Physio patients backup');
  assert(parsed.version === VERSION, `Unsupported backup version ${String(parsed.version)}`);
  const dump = decode(parsed) as VaultDump;
  assert(dump.meta.pinSalt instanceof Uint8Array && dump.meta.pinWrapped.data instanceof Uint8Array, 'The backup has no key');
  assert(Array.isArray(dump.records) && Array.isArray(dump.files), 'The backup is incomplete');
  return { meta: dump.meta, records: dump.records, files: dump.files };
}

export function backupFileName(date: Date): string {
  return `mika-patients-${date.toISOString().slice(0, 10)}.json`;
}

/** Remind when there is data and the last backup is older than a week (or never made). */
export function backupIsDue(lastBackupAt: string | null, hasData: boolean, now: Date): boolean {
  if (!hasData) return false;
  if (lastBackupAt === null) return true;
  return now.getTime() - new Date(lastBackupAt).getTime() > 7 * 24 * 60 * 60 * 1000;
}
