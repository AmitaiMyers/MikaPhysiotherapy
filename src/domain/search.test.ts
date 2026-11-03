import { describe, expect, it } from 'vitest';
import { getMuscle, MUSCLES } from '../data';
import { agonists, antagonists, attachmentsOnBone, musclesSuppliedBy, musclesSuppliedViaBranches } from './relations';
import { actionKey, filterMuscles, NO_FILTERS } from './search';

const ids = (list: { id: string }[]) => list.map((m) => m.id);

describe('filterMuscles', () => {
  it('matches names, Latin names and synonyms, ignoring case and accents', () => {
    expect(ids(filterMuscles(MUSCLES, { ...NO_FILTERS, text: 'SUPRAspinatus' }))).toEqual(['supraspinatus']);
    expect(ids(filterMuscles(MUSCLES, { ...NO_FILTERS, text: 'boxer’s' }))).toEqual(['serratus-anterior']);
    expect(ids(filterMuscles(MUSCLES, { ...NO_FILTERS, text: 'musculus teres' })).sort()).toEqual(['pronator-teres', 'teres-major', 'teres-minor']);
  });

  it('finds the muscles supplied by a nerve', () => {
    expect(ids(filterMuscles(MUSCLES, { ...NO_FILTERS, nerveId: 'axillary' }))).toEqual(['deltoid', 'teres-minor']);
  });

  it('finds the muscles receiving a root', () => {
    const c4 = ids(filterMuscles(MUSCLES, { ...NO_FILTERS, root: 'C4' }));
    expect(c4).toContain('trapezius');
    expect(c4).toContain('levator-scapulae');
    expect(c4).not.toContain('deltoid');
  });

  it('finds the muscles performing a movement', () => {
    const abductors = ids(filterMuscles(MUSCLES, { ...NO_FILTERS, action: actionKey('glenohumeral', 'abduction') }));
    expect(abductors).toEqual(expect.arrayContaining(['deltoid', 'supraspinatus']));
  });

  it('finds the muscles attaching to a bone and combines filters', () => {
    const pisiform = ids(filterMuscles(MUSCLES, { ...NO_FILTERS, boneId: 'pisiform' }));
    expect(pisiform).toEqual(['flexor-carpi-ulnaris', 'abductor-digiti-minimi-hand']);
    expect(ids(filterMuscles(MUSCLES, { ...NO_FILTERS, boneId: 'pisiform', nerveId: 'ulnar-deep' }))).toEqual(['abductor-digiti-minimi-hand']);
  });
});

describe('derived relationships', () => {
  it('lists agonists and antagonists from other muscles’ actions', () => {
    const biceps = getMuscle('biceps-brachii');
    const elbowFlexion = biceps.actions.find((a) => a.jointId === 'elbow' && a.movement === 'flexion');
    expect(elbowFlexion).toBeDefined();
    if (!elbowFlexion) return;
    expect(ids(agonists(biceps, elbowFlexion).map((r) => r.muscle))).toEqual(expect.arrayContaining(['brachialis', 'brachioradialis']));
    expect(ids(agonists(biceps, elbowFlexion).map((r) => r.muscle))).not.toContain('biceps-brachii');
    expect(ids(antagonists(biceps, elbowFlexion).map((r) => r.muscle))).toEqual(expect.arrayContaining(['triceps-brachii', 'anconeus']));
  });

  it('lists prime movers before assistants', () => {
    const deltoid = getMuscle('deltoid');
    const abduction = deltoid.actions.find((a) => a.movement === 'abduction');
    if (!abduction) throw new Error('deltoid abducts');
    const roles = agonists(deltoid, abduction).map((r) => r.action.role);
    expect([...roles].sort((a, b) => (a === b ? 0 : a === 'prime' ? -1 : 1))).toEqual(roles);
  });

  it('has no antagonists for movements without an opposite', () => {
    const supraspinatus = getMuscle('supraspinatus');
    const stabilisation = supraspinatus.actions.find((a) => a.movement.startsWith('stabilisation'));
    if (!stabilisation) throw new Error('supraspinatus stabilises');
    expect(antagonists(supraspinatus, stabilisation)).toEqual([]);
  });

  it('derives nerve and bone lookups', () => {
    expect(ids(musclesSuppliedBy('musculocutaneous'))).toEqual(['biceps-brachii', 'brachialis', 'coracobrachialis']);
    expect(ids(attachmentsOnBone('pisiform').insertions)).toEqual(['flexor-carpi-ulnaris']);
    expect(ids(attachmentsOnBone('pisiform').origins)).toEqual(['abductor-digiti-minimi-hand']);
  });

  it('includes muscles supplied through a nerve’s branches', () => {
    const viaRadialBranches = ids(musclesSuppliedViaBranches('radial'));
    expect(viaRadialBranches).toEqual(expect.arrayContaining(['extensor-digitorum', 'supinator', 'extensor-indicis']));
    expect(viaRadialBranches).not.toContain('triceps-brachii');
  });
});
