import type { Muscle, SpinalRoot } from '../data/types';
import { rootsOf } from './relations';

export interface MuscleFilters {
  text: string;
  nerveId: string | null;
  root: SpinalRoot | null;
  /** "jointId|movement" */
  action: string | null;
  boneId: string | null;
}

export const NO_FILTERS: MuscleFilters = { text: '', nerveId: null, root: null, action: null, boneId: null };

export function hasActiveFilters(filters: MuscleFilters): boolean {
  return filters.text.trim() !== '' || filters.nerveId !== null || filters.root !== null || filters.action !== null || filters.boneId !== null;
}

/** Lower-case and strip accents so "Cozen's" and "cozens" match. */
function normalise(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[’']/g, '')
    .toLowerCase();
}

/** True when every word of the query appears somewhere in the fields (an empty query matches). */
export function matchesWords(text: string, fields: string[]): boolean {
  const words = normalise(text).split(/\s+/).filter(Boolean);
  if (words.length === 0) return true;
  const haystack = normalise(fields.join(' '));
  return words.every((word) => haystack.includes(word));
}

export function actionKey(jointId: string, movement: string): string {
  return `${jointId}|${movement}`;
}

export function filterMuscles(muscles: Muscle[], filters: MuscleFilters): Muscle[] {
  return muscles.filter(
    (muscle) =>
      matchesWords(filters.text, [muscle.name, muscle.latinName, ...muscle.synonyms]) &&
      (filters.nerveId === null || muscle.innervation.some((s) => s.nerveId === filters.nerveId)) &&
      (filters.root === null || rootsOf(muscle).includes(filters.root)) &&
      (filters.action === null || muscle.actions.some((a) => actionKey(a.jointId, a.movement) === filters.action)) &&
      (filters.boneId === null || [...muscle.origin, ...muscle.insertion].some((a) => a.bones.includes(filters.boneId as string))),
  );
}
