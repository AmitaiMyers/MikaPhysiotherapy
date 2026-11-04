import type { Difficulty, Equipment, Exercise, ExerciseType } from '../data/exerciseTypes';
import { matchesWords } from './search';

export interface ExerciseFilters {
  text: string;
  muscleId: string | null;
  type: ExerciseType | null;
  equipment: Equipment | null;
  difficulty: Difficulty | null;
}

export function hasActiveExerciseFilters(filters: ExerciseFilters): boolean {
  return filters.text.trim() !== '' || filters.muscleId !== null || filters.type !== null || filters.equipment !== null || filters.difficulty !== null;
}

export function filterExercises(exercises: Exercise[], filters: ExerciseFilters): Exercise[] {
  return exercises.filter(
    (exercise) =>
      matchesWords(filters.text, [exercise.name, ...exercise.aliases]) &&
      (filters.muscleId === null || [...exercise.primaryMuscles, ...exercise.secondaryMuscles].includes(filters.muscleId)) &&
      (filters.type === null || exercise.type === filters.type) &&
      (filters.equipment === null || exercise.equipment.includes(filters.equipment)) &&
      (filters.difficulty === null || exercise.difficulty === filters.difficulty),
  );
}
