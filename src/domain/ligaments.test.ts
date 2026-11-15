import { describe, expect, it } from 'vitest';
import { getLigament, LIGAMENTS } from '../data/ligaments';
import { coRestraints, filterLigaments, ligamentsForProtocol, ligamentsOfJoint, ligamentsOnBone, ligamentsTestedBy, restraintsOf } from './ligaments';
import { actionKey } from './search';

const NONE = { text: '', jointId: null, boneId: null, kind: null, restrains: null };

describe('ligament relations', () => {
  it('finds the restraints of a motion, primary first', () => {
    const anterior = restraintsOf('knee', 'anterior tibial translation');
    expect(anterior[0]?.ligament.id).toBe('anterior-cruciate-ligament');
    expect(anterior.map((r) => r.ligament.id)).toContain('medial-meniscus');
  });

  it('lists co-restraints without the ligament itself', () => {
    const acl = getLigament('anterior-cruciate-ligament');
    const restraint = acl.restraints.find((r) => r.motion === 'anterior tibial translation');
    if (restraint === undefined) throw new Error('ACL restraint missing');
    const others = coRestraints(acl, restraint).map((r) => r.ligament.id);
    expect(others).not.toContain('anterior-cruciate-ligament');
    expect(others).toContain('medial-collateral-ligament-knee');
  });

  it('links joints, bones, tests and protocols back to their ligaments', () => {
    expect(ligamentsOfJoint('knee').map((l) => l.id)).toContain('posterior-cruciate-ligament');
    expect(ligamentsOnBone('talus').map((l) => l.id)).toContain('anterior-talofibular-ligament');
    expect(ligamentsTestedBy('lachman').map((l) => l.id)).toEqual(['anterior-cruciate-ligament']);
    expect(ligamentsForProtocol('aclr').map((l) => l.id)).toContain('anterior-cruciate-ligament');
  });

  it('filters by text, joint, bone, kind and restrained motion', () => {
    expect(filterLigaments(LIGAMENTS, { ...NONE, text: 'ACL' }).map((l) => l.id)).toEqual(['anterior-cruciate-ligament']);
    expect(filterLigaments(LIGAMENTS, { ...NONE, kind: 'meniscus' }).map((l) => l.id).sort()).toEqual(['lateral-meniscus', 'medial-meniscus']);
    const valgus = filterLigaments(LIGAMENTS, { ...NONE, restrains: actionKey('knee', 'valgus') }).map((l) => l.id);
    expect(valgus).toContain('medial-collateral-ligament-knee');
    expect(filterLigaments(LIGAMENTS, { ...NONE, jointId: 'hip', boneId: 'fibula' })).toEqual([]);
  });
});
