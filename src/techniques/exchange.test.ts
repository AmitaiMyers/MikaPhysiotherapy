import { describe, expect, it } from 'vitest';
import { applyImport, collectExport, exchangeFileName, parseExchange, planImport, serializeExchange } from './exchange';
import type { TechniqueContent } from './store';
import type { CustomTechnique, MediaItem, TechniqueNote } from './types';

const NOW = '2026-11-07T10:00:00.000Z';
const mine = { kind: 'mine' } as const;

const custom = (id: string, mediaIds: string[] = []): CustomTechnique => ({
  kind: 'technique',
  id,
  familyId: 'dry-needling',
  name: `Technique ${id}`,
  areas: ['neck'],
  muscleIds: ['trapezius'],
  jointIds: [],
  nerveIds: [],
  conditionIds: ['neck-pain'],
  summary: '',
  position: '',
  steps: ['One', 'Two'],
  keyPoints: [],
  dosage: '',
  safety: [],
  video: null,
  mediaIds,
  author: 'Mika',
  origin: mine,
  createdAt: NOW,
  updatedAt: NOW,
});

const note = (id: string, techniqueId: string, mediaIds: string[] = []): TechniqueNote => ({
  kind: 'note',
  id,
  techniqueId,
  type: 'variation',
  title: `Note ${id}`,
  text: 'Text',
  video: null,
  mediaIds,
  author: 'Mika',
  origin: mine,
  createdAt: NOW,
  updatedAt: NOW,
});

const media = (id: string): MediaItem => ({ kind: 'media', id, name: `${id}.jpg`, mimeType: 'image/jpeg', size: 3, createdAt: NOW });

const content = (techniques: CustomTechnique[], notes: TechniqueNote[], items: MediaItem[] = []): TechniqueContent => ({ ready: true, techniques, notes, media: items, storageError: null });

describe('technique exchange files', () => {
  const source = content([custom('c1', ['m1'])], [note('n1', 'dn-upper-trapezius', ['m2']), note('n2', 'c1'), note('n3', 'dn-masseter')], [media('m1'), media('m2')]);

  it('collects a custom technique, notes on a built-in one, and media only when asked', () => {
    const withMedia = collectExport(['c1', 'dn-upper-trapezius'], source, true);
    expect(withMedia.techniques.map((t) => t.id)).toEqual(['c1']);
    expect(withMedia.builtins).toEqual([{ id: 'dn-upper-trapezius', name: 'Dry needling — upper trapezius' }]);
    expect(withMedia.notes.map((n) => n.id)).toEqual(['n1', 'n2']);
    expect(withMedia.mediaItems.map((m) => m.id)).toEqual(['m1', 'm2']);

    const withoutMedia = collectExport(['c1'], source, false);
    expect(withoutMedia.mediaItems).toEqual([]);
    expect(withoutMedia.techniques[0]?.mediaIds).toEqual([]);
  });

  it('fails fast on an unknown technique id', () => {
    expect(() => collectExport(['nope'], source, false)).toThrow(/not found/);
  });

  it('round-trips through a file and rejects other files', () => {
    const selection = collectExport(['c1'], source, true);
    const text = serializeExchange(selection, [{ item: media('m1'), base64: 'AAA=' }], 'Mika', NOW);
    const file = parseExchange(text);
    expect(file.author).toBe('Mika');
    expect(file.techniques).toHaveLength(1);
    expect(() => parseExchange('{"format":"other"}')).toThrow(/not a Mika Physio technique file/);
  });

  it('plans an import with conflicts and unavailable built-ins', () => {
    const file = parseExchange(serializeExchange({ ...collectExport(['c1', 'dn-upper-trapezius'], source, false), notes: [note('n1', 'dn-upper-trapezius'), note('n9', 'not-a-technique')] }, [], 'Dana', NOW));
    const plan = planImport(file, content([custom('c1')], [note('n1', 'dn-upper-trapezius')]));
    expect(plan.map((i) => [i.id, i.conflict, i.unavailable])).toEqual([
      ['c1', true, false],
      ['n1', true, false],
      ['n9', false, true],
    ]);
  });

  it('applies keep-both, replace and skip, remapping ids and marking the sender', () => {
    const file = parseExchange(serializeExchange(collectExport(['c1', 'dn-upper-trapezius'], source, true), [{ item: media('m1'), base64: 'AAA=' }, { item: media('m2'), base64: 'BBB=' }], 'Dana', NOW));
    let counter = 0;
    const newId = () => `new-${++counter}`;

    const keepBoth = applyImport(file, {}, NOW, newId);
    const technique = keepBoth.records.find((r) => r.kind === 'technique');
    expect(technique?.id).toMatch(/^new-/);
    expect(technique?.kind === 'technique' && technique.origin).toEqual({ kind: 'imported', from: 'Dana', importedAt: NOW });
    const noteOnCustom = keepBoth.records.find((r) => r.kind === 'note' && r.title === 'Note n2');
    expect(noteOnCustom?.kind === 'note' && noteOnCustom.techniqueId).toBe(technique?.id);
    expect(keepBoth.media.map((m) => m.item.id).every((id) => id.startsWith('new-'))).toBe(true);

    const replace = applyImport(file, { c1: 'replace', n1: 'replace', n2: 'replace' }, NOW, newId);
    expect(replace.records.map((r) => r.id).sort()).toEqual(['c1', 'n1', 'n2']);

    const skipped = applyImport(file, { c1: 'skip' }, NOW, newId);
    expect(skipped.records.map((r) => (r.kind === 'note' ? r.title : r.id))).toEqual(['Note n1']);
  });

  it('names the file after the technique', () => {
    expect(exchangeFileName(['Dry needling — upper trapezius'], new Date(NOW))).toBe('dry-needling-upper-trapezius-2026-11-07.technique.json');
    expect(exchangeFileName(['A', 'B'], new Date(NOW))).toBe('2-techniques-2026-11-07.technique.json');
  });
});
