import { describe, expect, it } from 'vitest';
import { emptyContent, lastCompletedSession, scoreSubjects, sessionStructure, sortSessionsNewestFirst } from './sessions';
import type { Session } from './types';

const session = (patch: Partial<Session>): Session => ({
  id: 's',
  patientId: 'p1',
  episodeId: 'e1',
  status: 'done',
  date: '2026-11-01',
  startTime: '09:00',
  durationMin: 60,
  seriesId: null,
  createdAt: '',
  updatedAt: '',
  ...emptyContent(),
  ...patch,
});

describe('sessions', () => {
  it('keeps the plan and clears the findings when copying the structure', () => {
    const done = session({
      subjective: { notes: 'Better', pain: { rest: 2, activity: 5, worst: 6 } },
      objective: {
        ...emptyContent().objective,
        rom: [{ jointId: 'knee', movement: 'Flexion', side: 'right', active: 95, passive: 105, note: 'end feel firm' }],
        tests: [{ testId: 'lachman', side: 'right', result: 'negative', note: '' }],
      },
      exercises: [{ exerciseId: 'quad-set', sets: [{ reps: 10, weightKg: null, durationSec: 10, rpe: 4 }], note: '' }],
      scores: [{ subject: 'Confidence', value: 6 }],
      assessment: 'Improving',
      protocol: { phaseIndex: 1, criteriaMet: ['Normal gait.'] },
    });
    const next = sessionStructure(done);
    expect(next.subjective.pain.activity).toBeNull();
    expect(next.objective.rom[0]).toMatchObject({ jointId: 'knee', movement: 'Flexion', side: 'right', active: null, passive: null });
    expect(next.objective.tests[0]?.result).toBeNull();
    expect(next.exercises[0]?.sets[0]?.reps).toBe(10);
    expect(next.scores).toEqual([{ subject: 'Confidence', value: null }]);
    expect(next.assessment).toBe('');
    expect(next.protocol).toEqual({ phaseIndex: 1, criteriaMet: [] });
    // The copy must not share arrays with the original.
    next.exercises[0]?.sets.push({ reps: 1, weightKg: null, durationSec: null, rpe: null });
    expect(done.exercises[0]?.sets).toHaveLength(1);
  });

  it('finds the last completed session of the episode', () => {
    const sessions = [
      session({ id: 'a', date: '2026-10-01' }),
      session({ id: 'b', date: '2026-10-20' }),
      session({ id: 'c', date: '2026-11-10', status: 'planned' }),
      session({ id: 'd', date: '2026-10-25', episodeId: 'other' }),
    ];
    expect(lastCompletedSession(sessions, 'p1', 'e1')?.id).toBe('b');
    expect(lastCompletedSession(sessions, 'p1', null)?.id).toBe('d');
    expect(sortSessionsNewestFirst(sessions).map((s) => s.id)).toEqual(['c', 'd', 'b', 'a']);
  });

  it('suggests the score subjects the patient already has first', () => {
    const subjects = scoreSubjects([session({ scores: [{ subject: 'Stairs', value: 4 }] })], 'p1');
    expect(subjects[0]).toBe('Stairs');
    expect(subjects).toContain('Pain');
  });
});
