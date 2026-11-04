/** Data model of the exercise database (Rehab tab). */

export type ExerciseRegionId = 'upper-neck' | 'lower' | 'spine-core' | 'whole-body';

export interface ExerciseGroup {
  id: string;
  name: string;
  description: string;
}

export interface ExerciseRegion {
  id: ExerciseRegionId;
  name: string;
  groups: ExerciseGroup[];
}

export type ExerciseType =
  | 'strength'
  | 'isometric'
  | 'mobility'
  | 'stretch'
  | 'motor-control'
  | 'balance'
  | 'plyometric'
  | 'neural'
  | 'breathing'
  | 'pelvic-floor'
  | 'conditioning'
  | 'functional';

export type Difficulty = 'beginner' | 'intermediate' | 'advanced';

export type Equipment =
  | 'none'
  | 'band'
  | 'dumbbell'
  | 'kettlebell'
  | 'barbell'
  | 'cable'
  | 'machine'
  | 'bench'
  | 'step'
  | 'wall'
  | 'ball'
  | 'foam-roller'
  | 'towel'
  | 'strap'
  | 'stick'
  | 'putty'
  | 'pressure-cuff'
  | 'balance-board'
  | 'box'
  | 'chair'
  | 'pulley'
  | 'bike'
  | 'pool'
  | 'walking-aid';

export interface Exercise {
  /** Stable kebab-case id, used in URLs and by protocols and programmes. */
  id: string;
  name: string;
  aliases: string[];
  regionId: ExerciseRegionId;
  groupId: string;
  type: ExerciseType;
  difficulty: Difficulty;
  equipment: Equipment[];
  /** Muscle ids from the Muscles tab. */
  primaryMuscles: string[];
  secondaryMuscles: string[];
  /** Nerve ids from the Nerves tab, for nerve mobility exercises. */
  nerveIds: string[];
  position: string;
  steps: string[];
  cues: string[];
  mistakes: string[];
  /** Typical starting dosage; adjust to the patient and the protocol phase. */
  dosage: string;
  /** Easier and harder versions (exercise ids). */
  regressionIds: string[];
  progressionIds: string[];
  precautions: string[];
  /** One short practical tip, in the style of a physio tip post. */
  tip: string;
  /** Specific research behind the exercise, where there is some. */
  evidence?: string;
  sourceIds: string[];
}

/** A YouTube video and where to start playing it. */
export interface VideoRef {
  id: string;
  startSec: number;
}
