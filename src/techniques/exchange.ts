/**
 * Technique files shared between physiotherapists: Mika's techniques, her notes and variations on
 * built-in techniques, and optionally their photos and videos. Pure functions; reading and writing
 * the files and storage happens in the screens.
 */
import { findTechnique } from '../data/techniques';
import { assert } from '../domain/assert';
import type { TechniqueContent } from './store';
import type { CustomTechnique, MediaItem, Origin, TechniqueNote, TechniqueRecord } from './types';

const FORMAT = 'mika-physio-techniques';
const VERSION = 1;

export interface ExportedMedia {
  item: MediaItem;
  base64: string;
}

export interface ExchangeFile {
  format: typeof FORMAT;
  version: typeof VERSION;
  exportedAt: string;
  author: string;
  techniques: CustomTechnique[];
  /** Built-in techniques the notes belong to, by id and name (the receiver has the content). */
  builtins: { id: string; name: string }[];
  notes: TechniqueNote[];
  media: ExportedMedia[];
}

export interface ExportSelection {
  techniques: CustomTechnique[];
  builtins: { id: string; name: string }[];
  notes: TechniqueNote[];
  mediaItems: MediaItem[];
}

/** What goes into a file for the chosen technique ids: the techniques, their notes and (optionally) media. */
export function collectExport(techniqueIds: string[], content: TechniqueContent, includeMedia: boolean): ExportSelection {
  const ids = new Set(techniqueIds);
  const techniques = content.techniques.filter((t) => ids.has(t.id));
  const builtins = techniqueIds.flatMap((id) => {
    const builtin = findTechnique(id);
    return builtin === undefined ? [] : [{ id, name: builtin.name }];
  });
  assert(techniques.length + builtins.length === ids.size, 'Some techniques to export were not found');
  const notes = content.notes.filter((n) => ids.has(n.techniqueId));
  const mediaIds = new Set(includeMedia ? [...techniques.flatMap((t) => t.mediaIds), ...notes.flatMap((n) => n.mediaIds)] : []);
  const strip = <T extends { mediaIds: string[] }>(record: T): T => ({ ...record, mediaIds: record.mediaIds.filter((id) => mediaIds.has(id)) });
  return {
    techniques: techniques.map(strip),
    builtins,
    notes: notes.map(strip),
    mediaItems: content.media.filter((m) => mediaIds.has(m.id)),
  };
}

export function serializeExchange(selection: ExportSelection, media: ExportedMedia[], author: string, exportedAt: string): string {
  const file: ExchangeFile = { format: FORMAT, version: VERSION, exportedAt, author, techniques: selection.techniques, builtins: selection.builtins, notes: selection.notes, media };
  return JSON.stringify(file);
}

/** Throws with a readable message when the file is not a technique file of this app. */
export function parseExchange(text: string): ExchangeFile {
  const parsed = JSON.parse(text) as Partial<ExchangeFile>;
  assert(parsed.format === FORMAT, 'This file is not a Mika Physio technique file');
  assert(parsed.version === VERSION, `Unsupported technique file version ${String(parsed.version)}`);
  assert(Array.isArray(parsed.techniques) && Array.isArray(parsed.builtins) && Array.isArray(parsed.notes) && Array.isArray(parsed.media), 'The technique file is incomplete');
  assert(typeof parsed.author === 'string' && typeof parsed.exportedAt === 'string', 'The technique file has no author');
  return parsed as ExchangeFile;
}

export function exchangeFileName(names: string[], date: Date): string {
  const slug = names.length === 1 ? (names[0] ?? 'technique').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') : `${names.length}-techniques`;
  return `${slug}-${date.toISOString().slice(0, 10)}.technique.json`;
}

export type ImportChoice = 'keep-both' | 'replace' | 'skip';

export interface ImportItem {
  /** The record's id in the file. */
  id: string;
  kind: 'technique' | 'note';
  label: string;
  /** The technique a note belongs to, by name. */
  belongsTo: string | null;
  /** A record with the same id already exists on this device. */
  conflict: boolean;
  /** A note for a built-in technique this version of the app does not have. */
  unavailable: boolean;
}

/** List what a file contains and what already exists, so Mika can choose per item. */
export function planImport(file: ExchangeFile, content: TechniqueContent): ImportItem[] {
  const existing = new Set([...content.techniques.map((t) => t.id), ...content.notes.map((n) => n.id)]);
  const nameOf = (techniqueId: string) => file.techniques.find((t) => t.id === techniqueId)?.name ?? file.builtins.find((b) => b.id === techniqueId)?.name ?? 'Unknown technique';
  return [
    ...file.techniques.map((t) => ({ id: t.id, kind: 'technique' as const, label: t.name, belongsTo: null, conflict: existing.has(t.id), unavailable: false })),
    ...file.notes.map((n) => {
      const ofCustom = file.techniques.some((t) => t.id === n.techniqueId);
      return {
        id: n.id,
        kind: 'note' as const,
        label: n.title || (n.type === 'variation' ? 'Variation' : 'Note'),
        belongsTo: nameOf(n.techniqueId),
        conflict: existing.has(n.id),
        unavailable: !ofCustom && findTechnique(n.techniqueId) === undefined,
      };
    }),
  ];
}

export interface ImportResult {
  records: TechniqueRecord[];
  media: ExportedMedia[];
}

/**
 * The records to save for Mika's choices. "Keep both" gives the imported record a new id; notes
 * follow their technique's new id; media always get new ids. Imported records are marked with
 * the sender's name.
 */
export function applyImport(file: ExchangeFile, choices: Readonly<Record<string, ImportChoice>>, now: string, newId: () => string): ImportResult {
  const origin: Origin = { kind: 'imported', from: file.author, importedAt: now };
  const choiceOf = (id: string): ImportChoice => choices[id] ?? 'keep-both';
  const idFor = (id: string) => (choiceOf(id) === 'keep-both' ? newId() : id);
  const techniqueIds = new Map(file.techniques.filter((t) => choiceOf(t.id) !== 'skip').map((t) => [t.id, idFor(t.id)]));
  const mediaIds = new Map(file.media.map((m) => [m.item.id, newId()]));
  const remapMedia = (ids: string[]) => ids.flatMap((id) => {
    const mapped = mediaIds.get(id);
    return mapped === undefined ? [] : [mapped];
  });

  const techniques: CustomTechnique[] = file.techniques.flatMap((t) => {
    const id = techniqueIds.get(t.id);
    return id === undefined ? [] : [{ ...t, id, mediaIds: remapMedia(t.mediaIds), origin, updatedAt: now }];
  });
  const notes: TechniqueNote[] = file.notes.flatMap((n) => {
    if (choiceOf(n.id) === 'skip') return [];
    const techniqueId = techniqueIds.get(n.techniqueId) ?? (findTechnique(n.techniqueId) === undefined ? undefined : n.techniqueId);
    if (techniqueId === undefined) return [];
    return [{ ...n, id: idFor(n.id), techniqueId, mediaIds: remapMedia(n.mediaIds), origin, updatedAt: now }];
  });
  const usedMedia = new Set([...techniques.flatMap((t) => t.mediaIds), ...notes.flatMap((n) => n.mediaIds)]);
  const media = file.media.flatMap((m) => {
    const id = mediaIds.get(m.item.id);
    return id === undefined || !usedMedia.has(id) ? [] : [{ item: { ...m.item, id }, base64: m.base64 }];
  });
  return { records: [...techniques, ...notes], media };
}
