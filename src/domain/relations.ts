/**
 * Relationships derived from the muscle records. Nothing here is typed in by hand, so the
 * agonist list of one muscle can never contradict the action list of another.
 */
import { getJoint, MUSCLES, NERVES } from '../data';
import type { Muscle, MuscleAction, Nerve, SpinalRoot } from '../data/types';
import { required } from './assert';

export interface RelatedMuscle {
  muscle: Muscle;
  action: MuscleAction;
}

/** The movement that undoes `movement` at `jointId`, if the joint defines one. */
export function oppositeMovement(jointId: string, movement: string): string | undefined {
  const joint = getJoint(jointId);
  const entry = required(
    joint.movements.find((m) => m.name === movement),
    `Joint "${jointId}" has no movement "${movement}"`,
  );
  return entry.opposite;
}

/** Muscles (other than `self`) that perform `movement` at `jointId`, prime movers first. */
export function musclesPerforming(jointId: string, movement: string, self?: Muscle): RelatedMuscle[] {
  const related: RelatedMuscle[] = [];
  for (const muscle of MUSCLES) {
    if (muscle === self) continue;
    for (const action of muscle.actions) {
      if (action.jointId === jointId && action.movement === movement) {
        related.push({ muscle, action });
      }
    }
  }
  return related.sort(byRoleThenName);
}

export function agonists(muscle: Muscle, action: MuscleAction): RelatedMuscle[] {
  return musclesPerforming(action.jointId, action.movement, muscle);
}

export function antagonists(muscle: Muscle, action: MuscleAction): RelatedMuscle[] {
  const opposite = oppositeMovement(action.jointId, action.movement);
  return opposite === undefined ? [] : musclesPerforming(action.jointId, opposite, muscle);
}

function byRoleThenName(a: RelatedMuscle, b: RelatedMuscle): number {
  if (a.action.role !== b.action.role) return a.action.role === 'prime' ? -1 : 1;
  return a.muscle.name.localeCompare(b.muscle.name);
}

export function musclesSuppliedBy(nerveId: string): Muscle[] {
  return MUSCLES.filter((m) => m.innervation.some((supply) => supply.nerveId === nerveId));
}

export function branchesOf(nerveId: string): Nerve[] {
  return NERVES.filter((nerve) => nerve.parentId === nerveId);
}

/** Muscles supplied by the nerve's branches (recursively), not by the nerve trunk itself. */
export function musclesSuppliedViaBranches(nerveId: string): Muscle[] {
  const direct = new Set(musclesSuppliedBy(nerveId));
  const viaBranches = branchesOf(nerveId).flatMap((branch) => [...musclesSuppliedBy(branch.id), ...musclesSuppliedViaBranches(branch.id)]);
  return [...new Set(viaBranches)].filter((m) => !direct.has(m));
}

/** All spinal roots a muscle receives, in segment order. */
export function rootsOf(muscle: Muscle): SpinalRoot[] {
  const roots = new Set(muscle.innervation.flatMap((supply) => supply.roots));
  return ROOT_ORDER.filter((root) => roots.has(root));
}

export function musclesWithRoot(root: SpinalRoot): Muscle[] {
  return MUSCLES.filter((m) => rootsOf(m).includes(root));
}

export interface BoneAttachments {
  origins: Muscle[];
  insertions: Muscle[];
}

export function attachmentsOnBone(boneId: string): BoneAttachments {
  const onBone = (key: 'origin' | 'insertion') => MUSCLES.filter((m) => m[key].some((a) => a.bones.includes(boneId)));
  return { origins: onBone('origin'), insertions: onBone('insertion') };
}

/** Every root used anywhere in the data, in segment order (for filters). */
export const ROOT_ORDER: SpinalRoot[] = [
  'CN XI',
  'C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7', 'C8',
  'T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12',
  'L1', 'L2', 'L3', 'L4', 'L5',
  'S1', 'S2', 'S3', 'S4', 'S5',
];

export function usedRoots(): SpinalRoot[] {
  const used = new Set(MUSCLES.flatMap(rootsOf));
  return ROOT_ORDER.filter((root) => used.has(root));
}

/** Format roots compactly: three or more consecutive roots as a range ("C5–C7"), otherwise a list ("C8, T1"). */
export function formatRoots(roots: SpinalRoot[]): string {
  const sorted = ROOT_ORDER.filter((root) => roots.includes(root));
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  if (first === undefined || last === undefined) return '';
  const consecutive = ROOT_ORDER.indexOf(last) - ROOT_ORDER.indexOf(first) === sorted.length - 1;
  return consecutive && sorted.length >= 3 ? `${first}–${last}` : sorted.join(', ');
}
