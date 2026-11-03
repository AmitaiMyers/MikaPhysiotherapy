import { describe, expect, it } from 'vitest';
import { formatRoots, oppositeMovement } from '../domain/relations';
import { BONES, findBone, findJoint, findNerve, findSpecialTest, JOINTS, MUSCLES, NERVES, REGIONS, SOURCES, SPECIAL_TESTS } from './index';

const groupIds = new Set(REGIONS.flatMap((region) => region.groups.map((group) => `${region.id}/${group.id}`)));
const sourceIds = new Set(SOURCES.map((source) => source.id));

describe('muscle records', () => {
  it('have kebab-case ids', () => {
    for (const muscle of MUSCLES) {
      expect(muscle.id, muscle.name).toMatch(/^[a-z]+(-[a-z]+)*$/);
    }
  });

  it.each(MUSCLES.map((m) => [m.id, m] as const))('%s references only known catalog entries', (_id, muscle) => {
    expect(groupIds.has(`${muscle.regionId}/${muscle.groupId}`), `group ${muscle.groupId}`).toBe(true);
    for (const attachment of [...muscle.origin, ...muscle.insertion]) {
      for (const bone of attachment.bones) {
        expect(findBone(bone), `bone ${bone}`).toBeDefined();
      }
    }
    expect(muscle.innervation.length, 'has a nerve supply').toBeGreaterThan(0);
    for (const supply of muscle.innervation) {
      expect(findNerve(supply.nerveId), `nerve ${supply.nerveId}`).toBeDefined();
      expect(supply.roots.length, `roots for ${supply.nerveId}`).toBeGreaterThan(0);
    }
    for (const action of muscle.actions) {
      const joint = findJoint(action.jointId);
      expect(joint, `joint ${action.jointId}`).toBeDefined();
      expect(joint?.movements.map((m) => m.name), `movement at ${action.jointId}`).toContain(action.movement);
    }
    for (const testId of muscle.specialTestIds) {
      expect(findSpecialTest(testId), `special test ${testId}`).toBeDefined();
    }
    for (const sourceId of muscle.sourceIds) {
      expect(sourceIds.has(sourceId), `source ${sourceId}`).toBe(true);
    }
  });

  it.each(MUSCLES.map((m) => [m.id, m] as const))('%s has every content section filled in', (_id, muscle) => {
    expect(muscle.summary.length).toBeGreaterThan(20);
    expect(muscle.latinName).toMatch(/^Muscul(us|i) /);
    expect(muscle.structure.length).toBeGreaterThan(0);
    expect(muscle.origin.length).toBeGreaterThan(0);
    expect(muscle.insertion.length).toBeGreaterThan(0);
    expect(muscle.bloodSupply.length).toBeGreaterThan(0);
    expect(muscle.functions.length).toBeGreaterThan(0);
    expect(muscle.clinical.length).toBeGreaterThan(0);
    expect(muscle.palpation.length).toBeGreaterThan(0);
    expect(muscle.muscleTest.position.length).toBeGreaterThan(0);
  });

  it('do not list the same action twice', () => {
    for (const muscle of MUSCLES) {
      const keys = muscle.actions.map((a) => `${a.jointId}/${a.movement}`);
      expect(new Set(keys).size, muscle.id).toBe(keys.length);
    }
  });

  it.each([
    ['upper-limb', 50],
    ['lower-limb', 50],
  ])('cover the physio-relevant muscles of the %s', (regionId, count) => {
    expect(MUSCLES.filter((m) => m.regionId === regionId)).toHaveLength(count);
  });
});

describe('catalogs', () => {
  it('joint movements declare symmetric opposites', () => {
    for (const joint of JOINTS) {
      for (const movement of joint.movements) {
        if (movement.opposite === undefined) continue;
        expect(oppositeMovement(joint.id, movement.opposite), `${joint.id}: ${movement.name}`).toBe(movement.name);
      }
    }
  });

  it('nerve branches point to known parent nerves', () => {
    for (const nerve of NERVES) {
      if (nerve.parentId !== undefined) expect(findNerve(nerve.parentId), `${nerve.id} → ${nerve.parentId}`).toBeDefined();
    }
  });

  it('joints reference known bones', () => {
    for (const joint of JOINTS) {
      for (const bone of joint.bones) {
        expect(findBone(bone), `${joint.id}: ${bone}`).toBeDefined();
      }
    }
  });

  it('every special test is used by at least one muscle', () => {
    const used = new Set(MUSCLES.flatMap((m) => m.specialTestIds));
    for (const test of SPECIAL_TESTS) {
      expect(used.has(test.id), test.id).toBe(true);
    }
  });

  it('every bone id is unique and referenced bones exist', () => {
    expect(new Set(BONES.map((b) => b.id)).size).toBe(BONES.length);
  });
});

describe('formatRoots', () => {
  it('shows three or more consecutive roots as a range', () => {
    expect(formatRoots(['C5', 'C6', 'C7'])).toBe('C5–C7');
    expect(formatRoots(['C7', 'C8', 'T1'])).toBe('C7–T1');
  });

  it('lists two roots or a gap explicitly', () => {
    expect(formatRoots(['C8', 'T1'])).toBe('C8, T1');
    expect(formatRoots(['C3', 'C4', 'C6'])).toBe('C3, C4, C6');
    expect(formatRoots(['CN XI'])).toBe('CN XI');
  });
});
