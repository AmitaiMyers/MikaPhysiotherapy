/** Numeric series over time from completed sessions, for the progress charts. */
import type { MmtGrade, Session } from './types';

export type SeriesGroup = 'Pain & scores' | 'Range of motion' | 'Strength' | 'Outcome measures' | 'Girth';

export const SERIES_GROUPS: SeriesGroup[] = ['Pain & scores', 'Range of motion', 'Strength', 'Outcome measures', 'Girth'];

export interface SeriesPoint {
  date: string;
  value: number;
}

export interface Series {
  key: string;
  group: SeriesGroup;
  label: string;
  unit: string;
  /** Fixed y range for 0–10 scales, so trends are comparable. */
  range: readonly [number, number] | null;
  points: SeriesPoint[];
}

const MMT_VALUES: Record<MmtGrade, number> = { '0': 0, '1': 1, '2': 2, '3-': 2.7, '3': 3, '3+': 3.3, '4-': 3.7, '4': 4, '4+': 4.3, '5': 5 };

const sideLabel = (side: 'left' | 'right') => (side === 'left' ? 'L' : 'R');

/** Build every series that has at least one value, in chronological order of the sessions. */
export function progressSeries(sessions: Session[], jointName: (jointId: string) => string): Series[] {
  const byKey = new Map<string, Series>();
  const add = (key: string, base: Omit<Series, 'key' | 'points'>, date: string, value: number | null) => {
    if (value === null) return;
    const series = byKey.get(key) ?? { key, ...base, points: [] };
    series.points.push({ date, value });
    byKey.set(key, series);
  };
  const done = sessions.filter((s) => s.status === 'done').sort((a, b) => `${a.date} ${a.startTime}`.localeCompare(`${b.date} ${b.startTime}`));
  for (const session of done) {
    const { date } = session;
    const pain = session.subjective.pain;
    const painBase = { group: 'Pain & scores', unit: '/10', range: [0, 10] } as const;
    add('pain:rest', { ...painBase, label: 'Pain at rest' }, date, pain.rest);
    add('pain:activity', { ...painBase, label: 'Pain on activity' }, date, pain.activity);
    add('pain:worst', { ...painBase, label: 'Worst pain (24 h)' }, date, pain.worst);
    for (const score of session.scores) add(`score:${score.subject}`, { ...painBase, label: score.subject }, date, score.value);
    for (const rom of session.objective.rom) {
      const name = `${jointName(rom.jointId)}: ${rom.movement} (${sideLabel(rom.side)})`;
      add(`rom:${rom.jointId}:${rom.movement}:${rom.side}:active`, { group: 'Range of motion', label: `${name} active`, unit: '°', range: null }, date, rom.active);
      add(`rom:${rom.jointId}:${rom.movement}:${rom.side}:passive`, { group: 'Range of motion', label: `${name} passive`, unit: '°', range: null }, date, rom.passive);
    }
    for (const strength of session.objective.strength) {
      const name = `${strength.label} (${sideLabel(strength.side)})`;
      add(`mmt:${strength.label}:${strength.side}`, { group: 'Strength', label: `${name} MMT`, unit: '/5', range: [0, 5] as const }, date, strength.mmt === null ? null : MMT_VALUES[strength.mmt]);
      add(`dyn:${strength.label}:${strength.side}`, { group: 'Strength', label: `${name} dynamometer`, unit: ' kg', range: null }, date, strength.dynamometerKg);
    }
    for (const outcome of session.objective.outcomes) add(`outcome:${outcome.measure}`, { group: 'Outcome measures', label: outcome.measure, unit: '', range: null }, date, outcome.score);
    for (const girth of session.objective.girth) add(`girth:${girth.site}:${girth.side}`, { group: 'Girth', label: `${girth.site} (${sideLabel(girth.side)})`, unit: ' cm', range: null }, date, girth.cm);
  }
  return [...byKey.values()];
}

/** Change from the first to the latest value, e.g. "+15°". */
export function seriesChange(series: Series): string {
  const first = series.points[0];
  const last = series.points.at(-1);
  if (first === undefined || last === undefined || series.points.length < 2) return '';
  const delta = Math.round((last.value - first.value) * 10) / 10;
  return `${delta > 0 ? '+' : ''}${delta}${series.unit}`;
}

export interface TechniqueUse {
  techniqueId: string;
  /** Dates of the completed sessions that used it, oldest first. */
  dates: string[];
}

/** Which techniques were used in completed sessions and when, in order of first use. */
export function techniqueTimeline(sessions: Session[]): TechniqueUse[] {
  const uses = new Map<string, string[]>();
  for (const session of [...sessions].filter((s) => s.status === 'done').sort((a, b) => a.date.localeCompare(b.date))) {
    for (const techniqueId of new Set(session.techniques.map((t) => t.techniqueId))) uses.set(techniqueId, [...(uses.get(techniqueId) ?? []), session.date]);
  }
  return [...uses.entries()].map(([techniqueId, dates]) => ({ techniqueId, dates }));
}
