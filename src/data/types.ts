/**
 * Data model of the knowledge base.
 *
 * Everything is fixed reference data shipped with the app. Relationships (agonists, antagonists,
 * "muscles supplied by this nerve", "muscles attaching to this bone") are derived from these
 * records at runtime instead of being typed twice, so they can never disagree with each other.
 */

export type RegionId = 'head-neck' | 'trunk-pelvis' | 'upper-limb' | 'lower-limb';

export interface Region {
  id: RegionId;
  name: string;
  /** Compartments / functional groups, in display order. */
  groups: MuscleGroup[];
}

export interface MuscleGroup {
  id: string;
  name: string;
  /** Short orientation text shown under the group heading. */
  description: string;
}

export type Layer = 'Superficial' | 'Intermediate' | 'Deep';

/** A spinal nerve root, e.g. "C5" or "T1". */
export type SpinalRoot = `C${1 | 2 | 3 | 4 | 5 | 6 | 7 | 8}` | `T${1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12}` | `L${1 | 2 | 3 | 4 | 5}` | `S${1 | 2 | 3 | 4 | 5}` | 'CN XI';

export interface Attachment {
  /** Precise landmark description, e.g. "Medial two-thirds of the supraspinous fossa". */
  text: string;
  /** Bones the landmark lies on; used for "what attaches to this bone" and to mark the 3D model. */
  bones: string[];
}

export interface NerveSupply {
  nerveId: string;
  /** Most commonly cited root values. */
  roots: SpinalRoot[];
}

export type ActionRole = 'prime' | 'assist';

export interface MuscleAction {
  jointId: string;
  /** Must be one of the joint's movements (validated by tests). */
  movement: string;
  role: ActionRole;
  /** Qualifier, e.g. "Only from a flexed position" or "Anterior fibres". */
  note?: string;
}

export interface TriggerPoint {
  location: string;
  referral: string;
}

export interface MuscleTest {
  /** Patient position and the test movement. */
  position: string;
  stabilize: string;
  resistance: string;
}

export interface Muscle {
  /** Stable kebab-case id, also used in the URL and image file names. */
  id: string;
  name: string;
  /** Terminologia Anatomica (TA2) Latin name. */
  latinName: string;
  synonyms: string[];
  regionId: RegionId;
  groupId: string;
  layer?: Layer;
  summary: string;
  /** Parts/heads, shape, fibre direction, relations. */
  structure: string[];
  origin: Attachment[];
  insertion: Attachment[];
  innervation: NerveSupply[];
  /** Disagreement between sources about innervation (roots or nerves), shown as a note. */
  innervationNote?: string;
  bloodSupply: string[];
  actions: MuscleAction[];
  /** Function in posture, gait and daily activity. */
  functions: string[];
  clinical: string[];
  palpation: string[];
  muscleTest: MuscleTest;
  stretch: string[];
  strengthening: string[];
  triggerPoints: TriggerPoint[];
  specialTestIds: string[];
  /** Deep tendon reflex mediated by this muscle, if any. */
  reflex?: { name: string; roots: SpinalRoot[] };
  /** Other notes where sources disagree (attachments, actions). */
  variationNotes: string[];
  sourceIds: string[];
}

export interface Nerve {
  id: string;
  name: string;
  roots: SpinalRoot[];
  /** Where it arises, e.g. "Posterior cord of the brachial plexus". */
  origin: string;
  /** The nerve this one branches from, e.g. the radial nerve for the posterior interosseous nerve. */
  parentId?: string;
  /** Skin area supplied; empty for purely motor nerves. */
  sensory: string;
  /** Typical lesion and what the patient presents with. */
  lesion: string[];
  sourceIds: string[];
}

export type BoneRegion = 'shoulder-girdle' | 'arm' | 'forearm' | 'hand' | 'axial';

export interface Bone {
  id: string;
  name: string;
  region: BoneRegion;
}

export interface JointMovement {
  name: string;
  /** Movement that undoes this one; used to derive antagonists. */
  opposite?: string;
  /** Normal active range in degrees (AAOS), where a standard value exists. */
  rangeDegrees?: number;
}

export interface Joint {
  id: string;
  name: string;
  type: string;
  bones: string[];
  movements: JointMovement[];
}

export interface SpecialTest {
  id: string;
  name: string;
  /** What the test assesses, e.g. "Supraspinatus tendon pathology". */
  purpose: string;
  procedure: string[];
  positive: string;
  notes: string[];
  sourceIds: string[];
}

export interface Source {
  id: string;
  citation: string;
  url?: string;
}
