import { describe, expect, it } from 'vitest';
import { layoutLanes, minutesToTime, recurringDates, timeToMinutes, weekDays, weekStart } from './calendar';

describe('calendar', () => {
  it('converts times', () => {
    expect(timeToMinutes('09:30')).toBe(570);
    expect(minutesToTime(570)).toBe('09:30');
  });

  it('starts weeks on Monday', () => {
    expect(weekStart('2026-11-04')).toBe('2026-11-02');
    expect(weekStart('2026-11-08')).toBe('2026-11-02');
    expect(weekDays('2026-11-04')).toHaveLength(7);
  });

  it('builds a twice-weekly booking for 3 weeks', () => {
    // Wednesday 4 Nov; repeat Monday and Wednesday.
    expect(recurringDates('2026-11-04', [0, 2], 3)).toEqual(['2026-11-04', '2026-11-09', '2026-11-11', '2026-11-16', '2026-11-18']);
  });

  it('puts overlapping sessions side by side', () => {
    const lanes = layoutLanes([
      { id: 'a', start: 540, end: 600 },
      { id: 'b', start: 570, end: 600 },
      { id: 'c', start: 600, end: 660 },
    ]);
    const byId = Object.fromEntries(lanes.map((l) => [l.item.id, l]));
    expect(byId.a).toMatchObject({ lane: 0, lanes: 2 });
    expect(byId.b).toMatchObject({ lane: 1, lanes: 2 });
    expect(byId.c).toMatchObject({ lane: 0, lanes: 1 });
  });
});
