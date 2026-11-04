/** Data model of the fracture and post-operative rehabilitation protocols (Rehab tab). */

export type ProtocolKind = 'fracture' | 'surgery';

export type Treatment = 'operative' | 'non-operative' | 'either';

export type ProtocolRegionId = 'lower' | 'upper' | 'spine';

export interface ProtocolArea {
  id: string;
  name: string;
}

export interface ProtocolRegion {
  id: ProtocolRegionId;
  name: string;
  areas: ProtocolArea[];
}

/** An exercise from the exercise database, with a phase-specific note (range, load, graft). */
export interface PhaseExercise {
  exerciseId: string;
  note?: string;
}

export interface ProtocolPhase {
  name: string;
  /** Typical timing, e.g. "Weeks 0–2". Progress by the criteria, not by the calendar alone. */
  timeframe: string;
  goals: string[];
  /** Weight bearing, brace or sling, and range-of-motion limits. */
  protection: string[];
  precautions: string[];
  exercises: PhaseExercise[];
  /** Criteria to move to the next phase; empty for the last phase. */
  criteria: string[];
}

export interface Protocol {
  /** Stable kebab-case id, used in URLs. */
  id: string;
  kind: ProtocolKind;
  regionId: ProtocolRegionId;
  areaId: string;
  name: string;
  /** e.g. "Operative — intramedullary nail" or "Non-operative". */
  management: string;
  /** Decides who the disclaimer names: the operating surgeon, the treating clinic, or either. */
  treatment: Treatment;
  aliases: string[];
  summary: string;
  keyPoints: string[];
  phases: ProtocolPhase[];
  returnToActivity: string[];
  outcomeMeasures: string[];
  /** Where protocols and sources disagree, and variants (e.g. graft type). */
  notes: string[];
  sourceIds: string[];
}
