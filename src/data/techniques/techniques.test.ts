import { describe, expect, it } from 'vitest';
import { findBone, findJoint, findMuscle, findNerve } from '..';
import { findExercise } from '../exercises';
import { findProtocol } from '../protocols';
import { allTechniqueViews, linkedTechniques } from '../../techniques/view';
import { CONDITIONS, evidenceFor, findCondition, getReference, TECHNIQUE_FAMILIES, TECHNIQUE_REFERENCES, TECHNIQUES, techniquesInFamily } from '.';
import { TECHNIQUE_VIDEOS } from './videos';

describe('technique data', () => {
  it('has about a hundred techniques in twelve families', () => {
    expect(TECHNIQUE_FAMILIES).toHaveLength(12);
    expect(TECHNIQUES.length).toBeGreaterThanOrEqual(100);
    for (const family of TECHNIQUE_FAMILIES) expect(techniquesInFamily(family.id).length, family.id).toBeGreaterThan(0);
    expect(techniquesInFamily('dry-needling')).toHaveLength(30);
  });

  it('links techniques only to known anatomy, exercises and conditions', () => {
    for (const t of TECHNIQUES) {
      expect(t.areas.length, t.id).toBeGreaterThan(0);
      expect(t.conditionIds.length, t.id).toBeGreaterThan(0);
      expect(t.steps.length, t.id).toBeGreaterThan(1);
      for (const id of t.muscleIds) expect(findMuscle(id), `${t.id} muscle ${id}`).toBeDefined();
      for (const id of t.jointIds) expect(findJoint(id), `${t.id} joint ${id}`).toBeDefined();
      for (const id of t.nerveIds) expect(findNerve(id), `${t.id} nerve ${id}`).toBeDefined();
      for (const id of t.exerciseIds) expect(findExercise(id), `${t.id} exercise ${id}`).toBeDefined();
      for (const id of t.conditionIds) expect(findCondition(id), `${t.id} condition ${id}`).toBeDefined();
      for (const e of t.evidence) expect(t.conditionIds, `${t.id} evidence for ${e.conditionId}`).toContain(e.conditionId);
    }
  });

  it('cites only known references, and every reference is used', () => {
    const used = new Set<string>();
    const indications = [...TECHNIQUE_FAMILIES.flatMap((f) => f.evidence), ...TECHNIQUES.flatMap((t) => t.evidence)];
    for (const indication of indications) {
      expect(findCondition(indication.conditionId), indication.conditionId).toBeDefined();
      for (const id of indication.refIds) {
        expect(() => getReference(id)).not.toThrow();
        used.add(id);
      }
    }
    for (const family of TECHNIQUE_FAMILIES) for (const id of family.refIds) used.add(getReference(id).id);
    expect(TECHNIQUE_REFERENCES.filter((r) => !used.has(r.id)).map((r) => r.id)).toEqual([]);
    for (const reference of TECHNIQUE_REFERENCES) expect(reference.url).toMatch(/^https:\/\/(doi\.org|pubmed\.ncbi\.nlm\.nih\.gov)\//);
  });

  it('gives each family its session fields and a review date', () => {
    for (const family of TECHNIQUE_FAMILIES) {
      expect(family.sessionFields.length, family.id).toBeGreaterThan(0);
      expect(family.reviewed).toMatch(/^\d{4}-\d{2}$/);
    }
  });

  it('maps conditions to known protocols and areas used by techniques', () => {
    for (const condition of CONDITIONS) for (const id of condition.protocolIds) expect(findProtocol(id), `${condition.id} → ${id}`).toBeDefined();
    const usedConditions = new Set(TECHNIQUES.flatMap((t) => t.conditionIds));
    expect(CONDITIONS.filter((c) => !usedConditions.has(c.id)).map((c) => c.id)).toEqual([]);
  });

  it('uses the technique’s own evidence first, then the family’s, then expert opinion', () => {
    const snag = TECHNIQUES.find((t) => t.id === 'mulligan-c1c2-self-snag');
    expect(snag && evidenceFor(snag, 'cervicogenic-headache').refIds).toContain('snag-hall-2007');
    const trapezius = TECHNIQUES.find((t) => t.id === 'dn-upper-trapezius');
    expect(trapezius && evidenceFor(trapezius, 'neck-pain').grade).toBe('moderate');
    const masseter = TECHNIQUES.find((t) => t.id === 'dn-masseter');
    expect(masseter && evidenceFor(masseter, 'tmd').grade).toBe('limited');
    const tfl = TECHNIQUES.find((t) => t.id === 'dn-tensor-fasciae-latae');
    expect(tfl && evidenceFor(tfl, 'hip-oa').grade).toBe('expert');
  });

  it('derives links from anatomy to techniques', () => {
    const views = allTechniqueViews([]);
    expect(linkedTechniques(views, { kind: 'muscle', id: 'trapezius' }).map((t) => t.id)).toContain('dn-upper-trapezius');
    expect(findBone('talus')).toBeDefined();
    expect(linkedTechniques(views, { kind: 'bone', id: 'talus' }).map((t) => t.id)).toContain('mob-talocrural-posterior');
    expect(linkedTechniques(views, { kind: 'exercise', id: 'median-nerve-slider' }).map((t) => t.id)).toContain('nm-median');
  });

  it('has one YouTube tutorial per technique', () => {
    expect(Object.keys(TECHNIQUE_VIDEOS).sort()).toEqual(TECHNIQUES.map((t) => t.id).sort());
    for (const video of Object.values(TECHNIQUE_VIDEOS)) expect(video.id).toMatch(/^[\w-]{11}$/);
  });
});
