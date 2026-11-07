/** One view over built-in and custom techniques, for pickers, sessions and labels. */
import { findTechnique, getFamily, TECHNIQUE_FAMILIES, TECHNIQUES } from '../data/techniques';
import type { SessionField, Technique, TechniqueFamilyId } from '../data/techniqueTypes';
import type { CustomTechnique } from './types';

export type ResolvedTechnique = { kind: 'builtin'; technique: Technique } | { kind: 'custom'; technique: CustomTechnique };

export function resolveTechnique(id: string, customs: CustomTechnique[]): ResolvedTechnique | undefined {
  const builtin = findTechnique(id);
  if (builtin !== undefined) return { kind: 'builtin', technique: builtin };
  const custom = customs.find((c) => c.id === id);
  return custom === undefined ? undefined : { kind: 'custom', technique: custom };
}

export function techniqueName(id: string, customs: CustomTechnique[]): string {
  return resolveTechnique(id, customs)?.technique.name ?? 'Deleted technique';
}

export const OTHER_FAMILY_LABEL = 'Other technique';

export function familyName(familyId: TechniqueFamilyId | null): string {
  return familyId === null ? OTHER_FAMILY_LABEL : getFamily(familyId).name;
}

const OTHER_FIELDS: SessionField[] = [{ key: 'details', label: 'Details', placeholder: 'e.g. level, dose, time' }];

/** The dosage fields recorded in a session for a technique (its family's, or a free "details" field). */
export function sessionFieldsFor(id: string, customs: CustomTechnique[]): SessionField[] {
  const resolved = resolveTechnique(id, customs);
  if (resolved === undefined || resolved.technique.familyId === null) return OTHER_FIELDS;
  return getFamily(resolved.technique.familyId).sessionFields;
}

export interface TechniqueOption {
  id: string;
  name: string;
  group: string;
}

/** Every technique for a picker: built-in ones by family, then Mika's own. */
export function techniqueOptions(customs: CustomTechnique[]): TechniqueOption[] {
  return [
    ...TECHNIQUE_FAMILIES.flatMap((family) => TECHNIQUES.filter((t) => t.familyId === family.id).map((t) => ({ id: t.id, name: t.name, group: family.name }))),
    ...customs.map((c) => ({ id: c.id, name: c.name, group: 'My techniques' })),
  ];
}
