import { required } from '../../domain/assert';
import type { Difficulty, Equipment, Exercise, ExerciseGroup, ExerciseRegion, ExerciseType } from '../exerciseTypes';
import { indexById } from '../index';
import { EXERCISE_REGIONS } from './catalog';
import { HIP_KNEE_EXERCISES } from './hipKnee';
import { LEG_FOOT_EXERCISES } from './legFoot';
import { SHOULDER_ARM_EXERCISES } from './shoulderArm';
import { SPINE_BODY_EXERCISES } from './spineBody';
import { NECK_SCAPULA_EXERCISES } from './upperNeck';

export { EXERCISE_REGIONS };

export const EXERCISES: Exercise[] = [
  ...NECK_SCAPULA_EXERCISES,
  ...SHOULDER_ARM_EXERCISES,
  ...HIP_KNEE_EXERCISES,
  ...LEG_FOOT_EXERCISES,
  ...SPINE_BODY_EXERCISES,
];

export const EXERCISE_TYPE_LABELS: Record<ExerciseType, string> = {
  strength: 'Strength',
  isometric: 'Isometric',
  mobility: 'Mobility',
  stretch: 'Stretch',
  'motor-control': 'Motor control',
  balance: 'Balance',
  plyometric: 'Plyometric',
  neural: 'Nerve mobility',
  breathing: 'Breathing',
  'pelvic-floor': 'Pelvic floor',
  conditioning: 'Conditioning',
  functional: 'Functional',
};

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
};

export const EQUIPMENT_LABELS: Record<Equipment, string> = {
  none: 'No equipment',
  band: 'Resistance band',
  dumbbell: 'Dumbbell',
  kettlebell: 'Kettlebell',
  barbell: 'Barbell',
  cable: 'Cable',
  machine: 'Machine',
  bench: 'Bench',
  step: 'Step',
  wall: 'Wall',
  ball: 'Ball',
  'foam-roller': 'Foam roller',
  towel: 'Towel',
  strap: 'Strap or belt',
  stick: 'Stick or bar',
  putty: 'Putty',
  'pressure-cuff': 'Pressure biofeedback',
  'balance-board': 'Balance board or pad',
  box: 'Box',
  chair: 'Chair',
  pulley: 'Pulley',
  bike: 'Bike',
  pool: 'Pool',
  'walking-aid': 'Walking aid',
};

const exerciseById = indexById(EXERCISES, 'exercise');
const groupById = indexById(
  EXERCISE_REGIONS.flatMap((region) => region.groups),
  'exercise group',
);

export const getExercise = (id: string): Exercise => required(exerciseById.get(id), `Unknown exercise "${id}"`);
export const findExercise = (id: string): Exercise | undefined => exerciseById.get(id);
export const getExerciseGroup = (id: string): ExerciseGroup => required(groupById.get(id), `Unknown exercise group "${id}"`);
export const getExerciseRegion = (id: string): ExerciseRegion =>
  required(
    EXERCISE_REGIONS.find((region) => region.id === id),
    `Unknown exercise region "${id}"`,
  );

/** Exercises that train a muscle, split by whether it is a primary or a secondary target. */
export function exercisesForMuscle(muscleId: string): { primary: Exercise[]; secondary: Exercise[] } {
  return {
    primary: EXERCISES.filter((e) => e.primaryMuscles.includes(muscleId)),
    secondary: EXERCISES.filter((e) => e.secondaryMuscles.includes(muscleId)),
  };
}

/** Exercises that mobilise a nerve. */
export const exercisesForNerve = (nerveId: string): Exercise[] => EXERCISES.filter((e) => e.nerveIds.includes(nerveId));

/** A YouTube search for a demonstration video (no specific video is endorsed). */
export function videoSearchUrl(exercise: Exercise): string {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(`${exercise.name} physiotherapy exercise`)}`;
}
