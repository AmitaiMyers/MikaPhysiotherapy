import { describe, expect, it } from 'vitest';
import { backupIsDue, parseBackup, serializeBackup, type VaultDump } from './backup';
import { randomBytes } from './crypto';

const dump = (): VaultDump => ({
  meta: { pinSalt: randomBytes(16), pinWrapped: { iv: randomBytes(12), data: randomBytes(48) }, biometric: null, lastBackupAt: null, createdAt: '2026-11-01T00:00:00.000Z' },
  records: [{ key: 'patient:1', kind: 'patient', iv: randomBytes(12), data: randomBytes(30) }],
  files: [{ id: 'f1', iv: randomBytes(12), data: randomBytes(100) }],
});

describe('backup files', () => {
  it('round-trips the encrypted vault, including byte arrays', () => {
    const original = dump();
    expect(parseBackup(serializeBackup(original, '2026-11-04T00:00:00.000Z'))).toEqual(original);
  });

  it('rejects files that are not backups', () => {
    expect(() => parseBackup('{"format":"other"}')).toThrow(/not a Mika Physio/);
  });

  it('is due when there is data and no backup in the last week', () => {
    const now = new Date('2026-11-04T12:00:00.000Z');
    expect(backupIsDue(null, true, now)).toBe(true);
    expect(backupIsDue(null, false, now)).toBe(false);
    expect(backupIsDue('2026-11-01T12:00:00.000Z', true, now)).toBe(false);
    expect(backupIsDue('2026-10-20T12:00:00.000Z', true, now)).toBe(true);
  });
});
