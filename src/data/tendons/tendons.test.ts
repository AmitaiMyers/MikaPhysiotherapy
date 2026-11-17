import depths from '../generated/muscleDepth.json';
import { describe, expect, it } from 'vitest';
import { TENDON_SOURCES } from '../../../scripts/anatomy/meshes/tendons.mjs';
import { EXERCISES } from '../exercises';
import { findBone, findMuscle, findSpecialTest, SOURCES } from '../index';
import { PROTOCOLS } from '../protocols';
import { TENDONS, tendonsOfMuscle } from './index';

const exerciseIds = new Set(EXERCISES.map((e) => e.id));
const protocolIds = new Set(PROTOCOLS.map((p) => p.id));
const sourceIds = new Set(SOURCES.map((s) => s.id));

const DEPTHS: Record<string, number> = depths;

describe('tendon records', () => {
  it('link only to muscles, bones, tests, exercises, protocols and sources that exist', () => {
    for (const t of TENDONS) {
      expect(t.id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
      expect(t.muscleIds.length, t.id).toBeGreaterThan(0);
      for (const id of t.muscleIds) expect(findMuscle(id), `${t.id} muscle ${id}`).toBeDefined();
      for (const a of t.attachments) for (const id of a.bones) expect(findBone(id), `${t.id} bone ${id}`).toBeDefined();
      for (const id of t.specialTestIds) expect(findSpecialTest(id), `${t.id} test ${id}`).toBeDefined();
      for (const id of t.exerciseIds) expect(exerciseIds.has(id), `${t.id} exercise ${id}`).toBe(true);
      for (const id of t.protocolIds) expect(protocolIds.has(id), `${t.id} protocol ${id}`).toBe(true);
      for (const id of t.sourceIds) expect(sourceIds.has(id), `${t.id} source ${id}`).toBe(true);
      for (const list of [t.muscleIds, t.specialTestIds, t.exerciseIds, t.protocolIds]) expect(new Set(list).size, `${t.id}: ${list.join(', ')}`).toBe(list.length);
    }
  });

  it('have a 3D shape for every tendon except the patellar tendon, which the atlas does not model', () => {
    const ids = new Set(TENDONS.map((t) => t.id));
    expect(Object.keys(TENDON_SOURCES).filter((id) => !ids.has(id))).toEqual([]);
    expect(TENDONS.filter((t) => !(t.id in TENDON_SOURCES)).map((t) => t.id)).toEqual(['patellar-tendon']);
  });

  it('name first a muscle the 3D body has, so Focus on a tendon has a muscle to focus', () => {
    const modelled = new Set(Object.keys(DEPTHS));
    expect(TENDONS.filter((t) => !modelled.has(t.muscleIds[0] as string)).map((t) => t.id)).toEqual([]);
  });

  it('are found from their muscles', () => {
    expect(tendonsOfMuscle('soleus').map((t) => t.id)).toEqual(['achilles-tendon']);
    expect(tendonsOfMuscle('biceps-brachii').map((t) => t.id)).toEqual(['long-head-biceps-tendon', 'distal-biceps-tendon']);
  });
});
