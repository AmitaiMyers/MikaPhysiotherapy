/** One search across the whole knowledge base: muscles, bones, joints, nerves, tests, exercises, protocols, techniques and conditions. */
import { BONES, JOINTS, MUSCLES, NERVES, SPECIAL_TESTS } from '../data';
import { EXERCISES } from '../data/exercises';
import { PROTOCOLS } from '../data/protocols';
import { CONDITIONS, getFamily, TECHNIQUES } from '../data/techniques';
import { matchesWords } from './search';

export type ResultKind = 'Muscle' | 'Bone' | 'Joint' | 'Nerve' | 'Special test' | 'Exercise' | 'Protocol' | 'Technique' | 'Condition';

export interface SearchResult {
  kind: ResultKind;
  title: string;
  subtitle: string;
  to: string;
}

interface Entry extends SearchResult {
  fields: string[];
}

const ENTRIES: Entry[] = [
  ...MUSCLES.map((m) => ({ kind: 'Muscle' as const, title: m.name, subtitle: m.latinName, to: `/muscles/${m.id}`, fields: [m.name, m.latinName, ...m.synonyms] })),
  ...BONES.map((b) => ({ kind: 'Bone' as const, title: b.name, subtitle: 'Bone', to: `/bones/${b.id}`, fields: [b.name] })),
  ...JOINTS.map((j) => ({ kind: 'Joint' as const, title: j.name, subtitle: j.type, to: `/joints/${j.id}`, fields: [j.name] })),
  ...NERVES.map((n) => ({ kind: 'Nerve' as const, title: n.name, subtitle: n.origin, to: `/nerves/${n.id}`, fields: [n.name] })),
  ...SPECIAL_TESTS.map((t) => ({ kind: 'Special test' as const, title: t.name, subtitle: t.purpose, to: `/tests/${t.id}`, fields: [t.name, t.purpose] })),
  ...EXERCISES.map((e) => ({ kind: 'Exercise' as const, title: e.name, subtitle: e.dosage, to: `/rehab/exercises/${e.id}`, fields: [e.name, ...e.aliases] })),
  ...PROTOCOLS.map((p) => ({ kind: 'Protocol' as const, title: p.name, subtitle: p.management, to: `/rehab/protocols/${p.id}`, fields: [p.name, p.management, ...p.aliases] })),
  ...TECHNIQUES.map((t) => ({ kind: 'Technique' as const, title: t.name, subtitle: getFamily(t.familyId).name, to: `/techniques/${t.id}`, fields: [t.name, ...t.aliases, ...getFamily(t.familyId).aliases] })),
  ...CONDITIONS.map((c) => ({ kind: 'Condition' as const, title: c.name, subtitle: 'Techniques by evidence', to: `/techniques/conditions/${c.id}`, fields: [c.name, ...c.aliases] })),
];

const normalise = (text: string) => text.trim().toLowerCase();

/** Matches with the best first: titles starting with the query, then titles containing it, then other fields. */
export function searchAll(text: string, limit = 60): SearchResult[] {
  const query = normalise(text);
  if (query === '') return [];
  const rank = (entry: Entry) => {
    const title = normalise(entry.title);
    if (title.startsWith(query)) return 0;
    if (title.includes(query)) return 1;
    return 2;
  };
  return ENTRIES.filter((entry) => matchesWords(text, entry.fields))
    .map((entry) => ({ entry, rank: rank(entry) }))
    .sort((a, b) => a.rank - b.rank || a.entry.title.length - b.entry.title.length)
    .slice(0, limit)
    .map(({ entry: { kind, title, subtitle, to } }) => ({ kind, title, subtitle, to }));
}
