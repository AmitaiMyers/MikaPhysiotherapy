/** Built-in and custom techniques in one shape, for listing, searching and cross-linking. */
import { getMuscle, JOINTS } from '../data';
import { CONDITIONS, evidenceFor, getCondition, getFamily, TECHNIQUES } from '../data/techniques';
import type { Indication, TechniqueAreaId, TechniqueFamilyId } from '../data/techniqueTypes';
import { matchesWords } from '../domain/search';
import { familyName, type ResolvedTechnique } from './catalog';
import type { CustomTechnique } from './types';

export interface TechniqueView {
  id: string;
  name: string;
  familyId: TechniqueFamilyId | null;
  aliases: string[];
  areas: TechniqueAreaId[];
  muscleIds: string[];
  jointIds: string[];
  nerveIds: string[];
  exerciseIds: string[];
  conditionIds: string[];
  summary: string;
  position: string;
  steps: string[];
  keyPoints: string[];
  dosage: string;
  safety: string[];
  /** Mika's own record, or null for a built-in technique. */
  custom: CustomTechnique | null;
  /** The evidence per condition (own studies, the family's, or expert opinion). */
  indications: Indication[];
}

export function viewOf(resolved: ResolvedTechnique): TechniqueView {
  if (resolved.kind === 'builtin') {
    const t = resolved.technique;
    return { ...t, custom: null, indications: t.conditionIds.map((id) => evidenceFor(t, id)) };
  }
  const c = resolved.technique;
  return {
    id: c.id,
    name: c.name,
    familyId: c.familyId,
    aliases: [],
    areas: c.areas,
    muscleIds: c.muscleIds,
    jointIds: c.jointIds,
    nerveIds: c.nerveIds,
    exerciseIds: [],
    conditionIds: c.conditionIds,
    summary: c.summary,
    position: c.position,
    steps: c.steps,
    keyPoints: c.keyPoints,
    dosage: c.dosage,
    safety: c.safety,
    custom: c,
    indications: c.conditionIds.map((id) => evidenceFor({ familyId: c.familyId, evidence: [] }, id)),
  };
}

/** Every technique: built-in first, then Mika's own. */
export function allTechniqueViews(customs: CustomTechnique[]): TechniqueView[] {
  return [...TECHNIQUES.map((technique) => viewOf({ kind: 'builtin', technique })), ...customs.map((technique) => viewOf({ kind: 'custom', technique }))];
}

/** Search names, aliases, family, target muscles and conditions. */
export function searchTechniques(views: TechniqueView[], text: string): TechniqueView[] {
  return views.filter((v) =>
    matchesWords(text, [v.name, ...v.aliases, familyName(v.familyId), ...(v.familyId === null ? [] : getFamily(v.familyId).aliases), ...v.muscleIds.map((id) => getMuscle(id).name), ...v.conditionIds.map((id) => getCondition(id).name)]),
  );
}

export type AnatomyLink = { kind: 'muscle' | 'joint' | 'nerve' | 'bone' | 'exercise' | 'condition'; id: string };

/** Techniques acting on a muscle, joint, nerve or bone (through its joints), continued by an exercise, or used for a condition. */
export function linkedTechniques(views: TechniqueView[], link: AnatomyLink): TechniqueView[] {
  switch (link.kind) {
    case 'muscle':
      return views.filter((v) => v.muscleIds.includes(link.id));
    case 'joint':
      return views.filter((v) => v.jointIds.includes(link.id));
    case 'nerve':
      return views.filter((v) => v.nerveIds.includes(link.id));
    case 'exercise':
      return views.filter((v) => v.exerciseIds.includes(link.id));
    case 'condition':
      return views.filter((v) => v.conditionIds.includes(link.id));
    case 'bone': {
      const jointIds = new Set(JOINTS.filter((j) => j.bones.includes(link.id)).map((j) => j.id));
      return views.filter((v) => v.jointIds.some((id) => jointIds.has(id)));
    }
  }
}

/** Conditions related to a rehab protocol (e.g. knee stiffness for a TKA). */
export const conditionsForProtocol = (protocolId: string) => CONDITIONS.filter((c) => c.protocolIds.includes(protocolId));

/** All references cited on a technique's page, without repeats. */
export function referenceIdsOf(view: TechniqueView): string[] {
  return [...new Set(view.indications.flatMap((i) => i.refIds))];
}
