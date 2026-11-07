import { required } from '../../domain/assert';
import { getJoint, indexById } from '../index';
import type { Condition, EvidenceGrade, EvidenceReference, Indication, ReferenceKind, Technique, TechniqueArea, TechniqueAreaId, TechniqueFamily, TechniqueFamilyId } from '../techniqueTypes';
import { CONDITIONS, TECHNIQUE_AREAS } from './conditions';
import { DRY_NEEDLING_TECHNIQUES } from './dryNeedling';
import { TECHNIQUE_FAMILIES } from './families';
import { MANUAL_THERAPY_TECHNIQUES } from './manualTherapy';
import { MULLIGAN_TECHNIQUES } from './mulligan';
import { TECHNIQUE_REFERENCES } from './references';
import { SOFT_TISSUE_TECHNIQUES } from './softTissue';
import { TAPING_TECHNIQUES } from './taping';

export { CONDITIONS, TECHNIQUE_AREAS, TECHNIQUE_FAMILIES, TECHNIQUE_REFERENCES };

export const TECHNIQUES: Technique[] = [...DRY_NEEDLING_TECHNIQUES, ...MULLIGAN_TECHNIQUES, ...TAPING_TECHNIQUES, ...MANUAL_THERAPY_TECHNIQUES, ...SOFT_TISSUE_TECHNIQUES];

const techniqueById = indexById(TECHNIQUES, 'technique');
const familyById = indexById(TECHNIQUE_FAMILIES, 'technique family');
const conditionById = indexById(CONDITIONS, 'condition');
const referenceById = indexById(TECHNIQUE_REFERENCES, 'reference');
const areaById = indexById(TECHNIQUE_AREAS, 'technique area');

export const getTechnique = (id: string): Technique => required(techniqueById.get(id), `Unknown technique "${id}"`);
export const findTechnique = (id: string): Technique | undefined => techniqueById.get(id);
export const getFamily = (id: TechniqueFamilyId): TechniqueFamily => required(familyById.get(id), `Unknown technique family "${id}"`);
export const findFamily = (id: string): TechniqueFamily | undefined => familyById.get(id);
export const getCondition = (id: string): Condition => required(conditionById.get(id), `Unknown condition "${id}"`);
export const findCondition = (id: string): Condition | undefined => conditionById.get(id);
export const getReference = (id: string): EvidenceReference => required(referenceById.get(id), `Unknown reference "${id}"`);
export const getArea = (id: TechniqueAreaId): TechniqueArea => required(areaById.get(id), `Unknown technique area "${id}"`);

export const EVIDENCE_GRADES: Record<EvidenceGrade, { label: string; description: string }> = {
  strong: { label: 'Strong', description: 'Consistent findings in guidelines or high-quality reviews.' },
  moderate: { label: 'Moderate', description: 'Supported by reviews or trials with some limitations, or a guideline recommendation.' },
  limited: { label: 'Limited', description: 'Few or low-quality trials; small or short-term effects.' },
  conflicting: { label: 'Conflicting', description: 'Trials and reviews disagree.' },
  expert: { label: 'Expert opinion', description: 'Common clinical practice with little direct trial evidence.' },
};

export const REFERENCE_KINDS: Record<ReferenceKind, string> = {
  guideline: 'Clinical practice guideline',
  'systematic-review': 'Systematic review',
  trial: 'Randomised trial',
  consensus: 'Consensus statement',
  safety: 'Safety',
};

/** Grades from strongest to weakest, for sorting. */
export const GRADE_ORDER: EvidenceGrade[] = ['strong', 'moderate', 'limited', 'conflicting', 'expert'];

/**
 * The evidence for using a technique in a condition: the technique's own studies first, then its
 * family's evidence for that condition, otherwise expert opinion.
 */
export function evidenceFor(technique: { familyId: TechniqueFamilyId | null; evidence: Indication[] }, conditionId: string): Indication {
  return (
    technique.evidence.find((e) => e.conditionId === conditionId) ??
    (technique.familyId === null ? undefined : getFamily(technique.familyId).evidence.find((e) => e.conditionId === conditionId)) ?? {
      conditionId,
      grade: 'expert',
      finding: 'Used in clinical practice for this condition; no direct trial evidence was found.',
      refIds: [],
    }
  );
}

export const techniquesInFamily = (familyId: TechniqueFamilyId): Technique[] => TECHNIQUES.filter((t) => t.familyId === familyId);

/** Area names of a technique, e.g. "Neck · Shoulder". */
export const areaNames = (areas: TechniqueAreaId[]): string => areas.map((id) => getArea(id).name).join(' · ');

/** Joint names, for display. */
export const jointNames = (jointIds: string[]): string[] => jointIds.map((id) => getJoint(id).name);
