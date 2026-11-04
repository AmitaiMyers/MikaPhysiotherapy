import { describe, expect, it } from 'vitest';
import { progressSeries, seriesChange } from './progress';
import { emptyContent } from './sessions';
import type { Session } from './types';

const session = (date: string, patch: Partial<Session>): Session => ({
  id: date,
  patientId: 'p',
  episodeId: null,
  status: 'done',
  date,
  startTime: '10:00',
  durationMin: 60,
  seriesId: null,
  createdAt: '',
  updatedAt: '',
  ...emptyContent(),
  ...patch,
});

const rom = (active: number | null) => ({ ...emptyContent().objective, rom: [{ jointId: 'knee', movement: 'flexion', side: 'right' as const, active, passive: null, note: '' }] });

describe('progress series', () => {
  const sessions = [
    session('2026-11-10', { objective: rom(110), scores: [{ subject: 'Confidence', value: 7 }], subjective: { notes: '', pain: { rest: 1, activity: 3, worst: null } } }),
    session('2026-11-01', { objective: rom(90), scores: [{ subject: 'Confidence', value: 4 }], subjective: { notes: '', pain: { rest: 3, activity: 6, worst: null } } }),
    session('2026-11-20', { status: 'planned', objective: rom(140) }),
  ];
  const series = progressSeries(sessions, () => 'Knee');
  const find = (key: string) => series.find((s) => s.key === key);

  it('follows each measurement over completed sessions in date order', () => {
    expect(find('rom:knee:flexion:right:active')?.points).toEqual([
      { date: '2026-11-01', value: 90 },
      { date: '2026-11-10', value: 110 },
    ]);
    expect(find('score:Confidence')?.points.map((p) => p.value)).toEqual([4, 7]);
    expect(find('pain:activity')?.range).toEqual([0, 10]);
  });

  it('leaves out measurements that were never recorded', () => {
    expect(find('pain:worst')).toBeUndefined();
    expect(find('rom:knee:flexion:right:passive')).toBeUndefined();
  });

  it('describes the change since the first value', () => {
    expect(seriesChange(find('rom:knee:flexion:right:active') ?? series[0]!)).toBe('+20°');
    expect(seriesChange(find('pain:activity') ?? series[0]!)).toBe('-3/10');
  });
});
