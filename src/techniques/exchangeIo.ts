/** Reading and writing technique files: the storage side of exchange.ts. */
import { fromBase64, toBase64 } from '../patients/crypto';
import { authorName } from './author';
import { applyImport, collectExport, exchangeFileName, serializeExchange, type ExchangeFile, type ImportChoice } from './exchange';
import { currentTechniqueContent, importMedia, mediaBlob, saveTechniqueRecord } from './store';

/** A technique file for the chosen techniques, ready to share. */
export async function exportTechniques(techniqueIds: string[], includeMedia: boolean): Promise<File> {
  const selection = collectExport(techniqueIds, currentTechniqueContent(), includeMedia);
  const media = await Promise.all(selection.mediaItems.map(async (item) => ({ item, base64: toBase64(new Uint8Array(await (await mediaBlob(item.id)).arrayBuffer())) })));
  const now = new Date();
  const text = serializeExchange(selection, media, authorName(), now.toISOString());
  const names = [...selection.builtins.map((b) => b.name), ...selection.techniques.map((t) => t.name)];
  return new File([text], exchangeFileName(names, now), { type: 'application/json' });
}

/** Save the records and media chosen from an imported file; returns how many records were added. */
export async function importTechniques(file: ExchangeFile, choices: Readonly<Record<string, ImportChoice>>): Promise<number> {
  const { records, media } = applyImport(file, choices, new Date().toISOString(), () => crypto.randomUUID());
  for (const exported of media) await importMedia({ ...exported.item }, new Blob([new Uint8Array(fromBase64(exported.base64))], { type: exported.item.mimeType }));
  for (const record of records) saveTechniqueRecord(record);
  return records.length;
}
