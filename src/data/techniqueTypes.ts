/**
 * Data model of the therapeutic techniques directory.
 *
 * A technique family (e.g. Dry Needling) holds the mechanism, safety and the evidence per condition.
 * Each technique is one specific application of a family (e.g. dry needling of the upper trapezius),
 * filed under the body areas it treats and linked to the exact muscles, joints and nerves.
 */
import type { RegionId } from './types';

/** Sub-regions of the four anatomy regions. */
export type TechniqueAreaId = 'head-jaw' | 'neck' | 'shoulder' | 'elbow' | 'wrist-hand' | 'thoracic' | 'lumbar' | 'pelvis' | 'hip' | 'knee' | 'ankle-foot';

export interface TechniqueArea {
  id: TechniqueAreaId;
  name: string;
  regionId: RegionId;
}

/** How strong the research behind a technique is for one condition. */
export type EvidenceGrade = 'strong' | 'moderate' | 'limited' | 'conflicting' | 'expert';

export type ReferenceKind = 'guideline' | 'systematic-review' | 'trial' | 'consensus' | 'safety';

export interface EvidenceReference {
  id: string;
  citation: string;
  year: number;
  kind: ReferenceKind;
  /** DOI link where known, otherwise a PubMed search for the exact title. */
  url: string;
}

/** What the research says about a technique for one condition. */
export interface Indication {
  conditionId: string;
  grade: EvidenceGrade;
  finding: string;
  refIds: string[];
}

export interface Condition {
  id: string;
  name: string;
  aliases: string[];
  areas: TechniqueAreaId[];
  /** Rehab protocols for the same problem (surgery or fracture), if any. */
  protocolIds: string[];
}

export type TechniqueFamilyId =
  | 'dry-needling'
  | 'mulligan'
  | 'elastic-taping'
  | 'rigid-taping'
  | 'joint-mobilisation'
  | 'manipulation'
  | 'muscle-energy'
  | 'soft-tissue'
  | 'trigger-point-pressure'
  | 'iastm'
  | 'cupping'
  | 'neural-mobilisation';

/** A dosage field recorded when the technique is used in a session, e.g. "Needles". */
export interface SessionField {
  key: string;
  label: string;
  placeholder: string;
}

export interface TechniqueFamily {
  id: TechniqueFamilyId;
  name: string;
  aliases: string[];
  summary: string;
  howItWorks: string[];
  benefits: string[];
  /** The overall state of the research in two or three sentences. */
  evidenceSummary: string;
  evidence: Indication[];
  contraindications: string[];
  precautions: string[];
  dosage: string[];
  /** Training or licensing note, when the technique needs a certificate. */
  training: string | null;
  sessionFields: SessionField[];
  refIds: string[];
  /** Year and month the evidence was last reviewed, YYYY-MM. */
  reviewed: string;
}

/** One application of a technique family to a body part. */
export interface Technique {
  id: string;
  familyId: TechniqueFamilyId;
  name: string;
  aliases: string[];
  areas: TechniqueAreaId[];
  muscleIds: string[];
  jointIds: string[];
  nerveIds: string[];
  /** Exercises from the Rehab tab that continue the technique at home. */
  exerciseIds: string[];
  conditionIds: string[];
  summary: string;
  /** Patient and therapist position. */
  position: string;
  steps: string[];
  /** Landmarks, direction, depth and cues that make the technique exact. */
  keyPoints: string[];
  dosage: string;
  /** Risks specific to this application, in addition to the family's. */
  safety: string[];
  /** Studies of this exact application; otherwise the family's evidence for the condition applies. */
  evidence: Indication[];
}
