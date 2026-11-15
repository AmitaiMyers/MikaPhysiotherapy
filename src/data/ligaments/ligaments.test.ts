import { describe, expect, it } from 'vitest';
import { EXERCISES } from '../exercises';
import { findBone, findJoint, findMuscle, findNerve, findSpecialTest, getJoint, SOURCES } from '../index';
import { PROTOCOLS } from '../protocols';
import { LIGAMENT_MESHES } from '../../../scripts/anatomy/meshes/ligaments.mjs';
import { ligamentViews } from '../images';
import { findLigament, LIGAMENT_GROUPS, LIGAMENTS } from './index';

const exerciseIds = new Set(EXERCISES.map((e) => e.id));
const protocolIds = new Set(PROTOCOLS.map((p) => p.id));
const sourceIds = new Set(SOURCES.map((s) => s.id));

describe('ligament records', () => {
  it('have kebab-case ids and a group in their region', () => {
    for (const ligament of LIGAMENTS) {
      expect(ligament.id, ligament.name).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
      expect(LIGAMENT_GROUPS[ligament.regionId].some((g) => g.id === ligament.groupId), `${ligament.id} group ${ligament.groupId}`).toBe(true);
    }
  });

  it('link only to joints, bones, muscles, nerves, tests, exercises, protocols and sources that exist', () => {
    for (const l of LIGAMENTS) {
      expect(l.jointIds.length, `${l.id} has no joint`).toBeGreaterThan(0);
      for (const id of l.jointIds) expect(findJoint(id), `${l.id} joint ${id}`).toBeDefined();
      for (const a of l.attachments) for (const id of a.bones) expect(findBone(id), `${l.id} bone ${id}`).toBeDefined();
      for (const id of l.protectiveMuscleIds) expect(findMuscle(id), `${l.id} muscle ${id}`).toBeDefined();
      for (const id of l.nerveIds) expect(findNerve(id), `${l.id} nerve ${id}`).toBeDefined();
      for (const id of l.specialTestIds) expect(findSpecialTest(id), `${l.id} test ${id}`).toBeDefined();
      for (const id of l.exerciseIds) expect(exerciseIds.has(id), `${l.id} exercise ${id}`).toBe(true);
      for (const id of l.protocolIds) expect(protocolIds.has(id), `${l.id} protocol ${id}`).toBe(true);
      for (const id of l.sourceIds) expect(sourceIds.has(id), `${l.id} source ${id}`).toBe(true);
    }
  });

  it('restrain only motions of their own joints: a movement or an accessory motion', () => {
    for (const l of LIGAMENTS) {
      for (const r of l.restraints) {
        expect(l.jointIds, `${l.id} restrains ${r.jointId} without listing it`).toContain(r.jointId);
        const joint = getJoint(r.jointId);
        const motions = [...joint.movements.map((m) => m.name), ...(joint.accessoryMotions ?? [])];
        expect(motions, `${l.id}: "${r.motion}" is not a motion of ${joint.id}`).toContain(r.motion);
      }
    }
  });

  it('fill every group of every region', () => {
    for (const [regionId, groups] of Object.entries(LIGAMENT_GROUPS)) {
      for (const group of groups) expect(LIGAMENTS.some((l) => l.regionId === regionId && l.groupId === group.id), `${regionId}/${group.id}`).toBe(true);
    }
  });

  it('list no item twice', () => {
    for (const l of LIGAMENTS) {
      for (const list of [l.jointIds, l.protectiveMuscleIds, l.nerveIds, l.specialTestIds, l.exerciseIds, l.protocolIds, l.synonyms]) {
        expect(new Set(list).size, `${l.id}: ${list.join(', ')}`).toBe(list.length);
      }
    }
  });

  it('cover every structure of the 3D atlas, and picture all but the few it does not model', () => {
    const appIds = new Set(LIGAMENTS.map((l) => l.id));
    expect(Object.keys(LIGAMENT_MESHES).filter((id) => !appIds.has(id))).toEqual([]);
    const withoutPicture = LIGAMENTS.filter((l) => ligamentViews(l.id).length === 0).map((l) => l.id);
    expect(withoutPicture.sort()).toEqual(['alar-ligaments', 'coracoacromial-ligament', 'lunotriquetral-ligament', 'scapholunate-ligament', 'tectorial-membrane', 'transverse-ligament-of-atlas']);
    expect(withoutPicture.filter((id) => id in LIGAMENT_MESHES)).toEqual([]);
    expect(findLigament('anterior-cruciate-ligament')?.name).toContain('ACL');
  });
});
