/**
 * Relations derived from the ligament records, so joint, bone, test and protocol pages always agree
 * with each ligament's own lists.
 */
import { LIGAMENTS } from '../data/ligaments';
import type { Ligament, LigamentKind, LigamentRestraint } from '../data/types';
import { actionKey, matchesWords } from './search';

export const KIND_LABELS: Record<LigamentKind, string> = {
  ligament: 'Ligament',
  capsule: 'Joint capsule',
  meniscus: 'Meniscus',
  labrum: 'Labrum',
  disc: 'Disc',
  membrane: 'Membrane',
  retinaculum: 'Retinaculum',
  aponeurosis: 'Aponeurosis',
  'fat pad': 'Fat pad',
  cartilage: 'Cartilage',
};

export const ligamentsOfJoint = (jointId: string): Ligament[] => LIGAMENTS.filter((l) => l.jointIds.includes(jointId));
export const ligamentsOnBone = (boneId: string): Ligament[] => LIGAMENTS.filter((l) => l.attachments.some((a) => a.bones.includes(boneId)));
export const ligamentsTestedBy = (testId: string): Ligament[] => LIGAMENTS.filter((l) => l.specialTestIds.includes(testId));
export const ligamentsForProtocol = (protocolId: string): Ligament[] => LIGAMENTS.filter((l) => l.protocolIds.includes(protocolId));

export interface RelatedRestraint {
  ligament: Ligament;
  restraint: LigamentRestraint;
}

/** Structures restraining one motion of a joint, primary restraints first. */
export function restraintsOf(jointId: string, motion: string): RelatedRestraint[] {
  return LIGAMENTS.flatMap((ligament) => ligament.restraints.filter((r) => r.jointId === jointId && r.motion === motion).map((restraint) => ({ ligament, restraint }))).sort(
    (a, b) => (a.restraint.role === b.restraint.role ? 0 : a.restraint.role === 'primary' ? -1 : 1),
  );
}

/** The other structures restraining the same motion: they share the load and take over when this one fails. */
export function coRestraints(ligament: Ligament, restraint: LigamentRestraint): RelatedRestraint[] {
  return restraintsOf(restraint.jointId, restraint.motion).filter((r) => r.ligament.id !== ligament.id);
}

export interface LigamentFilters {
  text: string;
  jointId: string | null;
  boneId: string | null;
  kind: LigamentKind | null;
  /** "jointId|motion" */
  restrains: string | null;
}

export function hasActiveLigamentFilters(filters: LigamentFilters): boolean {
  return filters.text.trim() !== '' || filters.jointId !== null || filters.boneId !== null || filters.kind !== null || filters.restrains !== null;
}

export function filterLigaments(ligaments: Ligament[], filters: LigamentFilters): Ligament[] {
  return ligaments.filter(
    (l) =>
      matchesWords(filters.text, [l.name, l.latinName, ...l.synonyms]) &&
      (filters.jointId === null || l.jointIds.includes(filters.jointId)) &&
      (filters.boneId === null || l.attachments.some((a) => a.bones.includes(filters.boneId as string))) &&
      (filters.kind === null || l.kind === filters.kind) &&
      (filters.restrains === null || l.restraints.some((r) => actionKey(r.jointId, r.motion) === filters.restrains)),
  );
}
