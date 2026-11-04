import type { Protocol } from '../protocolTypes';

/** A phase's timing in days from surgery or injury (day 0); end null means open-ended. */
export interface PhaseTiming {
  startDay: number;
  endDay: number | null;
}

const DAYS_PER_UNIT = { day: 1, week: 7, month: 30.44 } as const;

/**
 * Read the start of a phase timeframe such as "Weeks 2–6", "Months 3–6 and beyond",
 * "Month 3 onwards" or "Day 1 to discharge". Returns null for timing relative to another event
 * (e.g. "out of the cast"), which cannot be placed on the calendar from the surgery date.
 */
export function parsePhaseTiming(timeframe: string): PhaseTiming | null {
  if (/out of the cast/i.test(timeframe)) return null;
  const match = /^(Day|Week|Month)s? (\d+)(?:–(\d+))?/.exec(timeframe);
  if (match === null) return null;
  const unit = DAYS_PER_UNIT[(match[1] ?? '').toLowerCase() as keyof typeof DAYS_PER_UNIT];
  const start = Number(match[2]);
  const openEnded = match[3] === undefined || /beyond|onwards/.test(timeframe);
  return { startDay: Math.round(start * unit), endDay: openEnded ? null : Math.round(Number(match[3]) * unit) };
}

export interface ProtocolPosition {
  daysSinceStart: number;
  week: number;
  /** The phase the date falls in, or null when it cannot be told from the timing. */
  phaseIndex: number | null;
}

/** Where a patient is in a protocol on a given day, counted from the surgery or injury date. */
export function protocolPosition(protocol: Protocol, daysSinceStart: number): ProtocolPosition {
  const timings = protocol.phases.map((phase) => parsePhaseTiming(phase.timeframe));
  let phaseIndex: number | null = null;
  timings.forEach((timing, index) => {
    if (timing !== null && timing.startDay <= daysSinceStart) phaseIndex = index;
  });
  if (phaseIndex !== null) {
    const timing = timings[phaseIndex];
    const next = timings[phaseIndex + 1];
    // Past the end of the last datable phase, and the next one is relative: the phase is unknown.
    if (timing?.endDay != null && daysSinceStart > timing.endDay && next === null) phaseIndex = null;
  }
  return { daysSinceStart, week: Math.floor(daysSinceStart / 7), phaseIndex };
}
