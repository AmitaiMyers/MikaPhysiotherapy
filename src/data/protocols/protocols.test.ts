import { describe, expect, it } from 'vitest';
import { findExercise } from '../exercises';
import { SOURCES } from '../index';
import { PROTOCOL_REGIONS, PROTOCOLS } from './index';

const areaKeys = new Set(PROTOCOL_REGIONS.flatMap((region) => region.areas.map((area) => `${region.id}/${area.id}`)));
const sourceIds = new Set(SOURCES.map((source) => source.id));

describe('protocol records', () => {
  it('have kebab-case ids', () => {
    for (const protocol of PROTOCOLS) {
      expect(protocol.id, protocol.name).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    }
  });

  it.each(PROTOCOLS.map((p) => [p.id, p] as const))('%s references only known entries', (_id, protocol) => {
    expect(areaKeys.has(`${protocol.regionId}/${protocol.areaId}`), `area ${protocol.areaId}`).toBe(true);
    for (const phase of protocol.phases) {
      for (const item of phase.exercises) {
        expect(findExercise(item.exerciseId), `${phase.name}: exercise ${item.exerciseId}`).toBeDefined();
      }
    }
    for (const sourceId of protocol.sourceIds) {
      expect(sourceIds.has(sourceId), `source ${sourceId}`).toBe(true);
    }
  });

  it.each(PROTOCOLS.map((p) => [p.id, p] as const))('%s has every section filled in', (_id, protocol) => {
    expect(protocol.summary.length).toBeGreaterThan(30);
    expect(protocol.keyPoints.length).toBeGreaterThan(0);
    expect(protocol.phases.length).toBeGreaterThanOrEqual(3);
    expect(protocol.returnToActivity.length).toBeGreaterThan(0);
    expect(protocol.outcomeMeasures.length).toBeGreaterThan(0);
    expect(protocol.sourceIds.length).toBeGreaterThan(0);
    protocol.phases.forEach((phase, index) => {
      const isLast = index === protocol.phases.length - 1;
      expect(phase.goals.length, `${phase.name} goals`).toBeGreaterThan(0);
      expect(phase.protection.length, `${phase.name} protection`).toBeGreaterThan(0);
      expect(phase.exercises.length, `${phase.name} exercises`).toBeGreaterThan(0);
      expect(phase.criteria.length > 0, `${phase.name}: criteria only before the last phase`).toBe(!isLast);
      const ids = phase.exercises.map((e) => e.exerciseId);
      expect(new Set(ids).size, `${phase.name} lists an exercise once`).toBe(ids.length);
    });
  });
});
