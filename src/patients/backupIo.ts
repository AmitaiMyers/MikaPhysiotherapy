import { readAllFiles, readAllRecords, readMeta, replaceAll } from './db';
import { backupFileName, parseBackup, serializeBackup } from './backup';
import { markBackedUp, reloadAfterRestore } from './vault';
import { required } from '../domain/assert';

/** Download the vault as a backup file and remember when. */
export async function downloadBackup(): Promise<void> {
  const now = new Date();
  const text = serializeBackup({ meta: required(await readMeta(), 'No vault'), records: await readAllRecords(), files: await readAllFiles() }, now.toISOString());
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = backupFileName(now);
  link.click();
  URL.revokeObjectURL(url);
  await markBackedUp();
}

/** Replace the vault with a backup; it is then locked with the backup's PIN. */
export async function restoreBackup(file: File): Promise<void> {
  const dump = parseBackup(await file.text());
  await replaceAll(dump.meta, dump.records, dump.files);
  await reloadAfterRestore();
}
