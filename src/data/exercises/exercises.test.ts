import { describe, expect, it } from 'vitest';
import { findMuscle, findNerve, SOURCES } from '../index';
import { EXERCISE_REGIONS, EXERCISES, findExercise } from './index';

const groupKeys = new Set(EXERCISE_REGIONS.flatMap((region) => region.groups.map((group) => `${region.id}/${group.id}`)));
const sourceIds = new Set(SOURCES.map((source) => source.id));

describe('exercise records', () => {
  it('have kebab-case ids', () => {
    for (const exercise of EXERCISES) {
      expect(exercise.id, exercise.name).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    }
  });

  it.each(EXERCISES.map((e) => [e.id, e] as const))('%s references only known entries', (_id, exercise) => {
    expect(groupKeys.has(`${exercise.regionId}/${exercise.groupId}`), `group ${exercise.groupId}`).toBe(true);
    for (const muscleId of [...exercise.primaryMuscles, ...exercise.secondaryMuscles]) {
      expect(findMuscle(muscleId), `muscle ${muscleId}`).toBeDefined();
    }
    for (const nerveId of exercise.nerveIds) {
      expect(findNerve(nerveId), `nerve ${nerveId}`).toBeDefined();
    }
    for (const linkedId of [...exercise.regressionIds, ...exercise.progressionIds]) {
      expect(findExercise(linkedId), `exercise ${linkedId}`).toBeDefined();
      expect(linkedId, 'not linked to itself').not.toBe(exercise.id);
    }
    for (const sourceId of exercise.sourceIds) {
      expect(sourceIds.has(sourceId), `source ${sourceId}`).toBe(true);
    }
  });

  it.each(EXERCISES.map((e) => [e.id, e] as const))('%s has every content section filled in', (_id, exercise) => {
    expect(exercise.primaryMuscles.length + exercise.secondaryMuscles.length + exercise.nerveIds.length, 'targets').toBeGreaterThan(0);
    expect(exercise.equipment.length).toBeGreaterThan(0);
    expect(exercise.position.length).toBeGreaterThan(10);
    expect(exercise.steps.length).toBeGreaterThan(0);
    expect(exercise.cues.length).toBeGreaterThan(0);
    expect(exercise.mistakes.length).toBeGreaterThan(0);
    expect(exercise.dosage.length).toBeGreaterThan(3);
    expect(exercise.tip.length).toBeGreaterThan(20);
  });

  it.each(EXERCISES.map((e) => [e.id, e] as const))('%s does not repeat a muscle, equipment or link', (_id, exercise) => {
    const muscles = [...exercise.primaryMuscles, ...exercise.secondaryMuscles];
    expect(new Set(muscles).size, 'a muscle is primary or secondary, not both').toBe(muscles.length);
    expect(new Set(exercise.equipment).size).toBe(exercise.equipment.length);
    const links = [...exercise.regressionIds, ...exercise.progressionIds];
    expect(new Set(links).size, 'an exercise is a regression or a progression, not both').toBe(links.length);
  });

  it('cite specific research only together with its source', () => {
    for (const exercise of EXERCISES) {
      if (exercise.evidence === undefined || !/\(\w+.* \d{4}\)/.test(exercise.evidence)) continue;
      expect(exercise.sourceIds.length, `${exercise.id} cites a study`).toBeGreaterThan(2);
    }
  });

  it('cover every exercise group', () => {
    for (const key of groupKeys) {
      expect(EXERCISES.some((e) => `${e.regionId}/${e.groupId}` === key), key).toBe(true);
    }
  });

  it('form a large enough database', () => {
    expect(EXERCISES.length).toBeGreaterThanOrEqual(240);
  });
});
