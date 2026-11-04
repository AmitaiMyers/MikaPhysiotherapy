/**
 * Reading appointments from an iCalendar (.ics) export, e.g. Google Calendar → Settings →
 * Import & export → Export. Supports single events and simple repeating events (daily or weekly
 * RRULE with INTERVAL, COUNT, UNTIL and BYDAY, plus EXDATE). Times with a time zone (TZID) are
 * read as the device's local time; UTC times (…Z) are converted to local time.
 */
import { addDays, localDate, parseLocalDate } from './dates';
import { minutesToTime } from './calendar';

export interface CalendarEvent {
  uid: string;
  summary: string;
  /** Local date YYYY-MM-DD and time HH:MM. */
  date: string;
  startTime: string;
  durationMin: number;
}

interface RawEvent {
  uid: string;
  summary: string;
  start: Date;
  end: Date | null;
  allDay: boolean;
  cancelled: boolean;
  rrule: Map<string, string> | null;
  exdates: Set<string>;
}

/** Undo line folding: continuation lines start with a space or tab. */
function unfold(text: string): string[] {
  return text.replace(/\r\n?/g, '\n').replace(/\n[ \t]/g, '').split('\n');
}

/** "20261104T090000Z", "20261104T090000" or "20261104" → a Date in local time. */
function parseIcsDate(value: string): { date: Date; allDay: boolean } {
  const match = /^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})?(Z)?)?$/.exec(value.trim());
  if (match === null) throw new Error(`Unreadable date "${value}" in the calendar file`);
  const [, y, mo, d, h, mi, s, utc] = match;
  if (h === undefined) return { date: new Date(Number(y), Number(mo) - 1, Number(d)), allDay: true };
  const parts = [Number(y), Number(mo) - 1, Number(d), Number(h), Number(mi), Number(s ?? 0)] as const;
  return { date: utc === 'Z' ? new Date(Date.UTC(...parts)) : new Date(...parts), allDay: false };
}

function unescapeText(value: string): string {
  return value.replace(/\\n/gi, ' ').replace(/\\([,;\\])/g, '$1').trim();
}

const occurrenceKey = (date: Date) => `${localDate(date)} ${minutesToTime(date.getHours() * 60 + date.getMinutes())}`;

function parseEvents(text: string): RawEvent[] {
  const events: RawEvent[] = [];
  let current: RawEvent | null = null;
  for (const line of unfold(text)) {
    if (line === 'BEGIN:VEVENT') {
      current = { uid: '', summary: '', start: new Date(NaN), end: null, allDay: false, cancelled: false, rrule: null, exdates: new Set() };
      continue;
    }
    if (current === null) continue;
    if (line === 'END:VEVENT') {
      if (!Number.isNaN(current.start.getTime())) events.push(current);
      current = null;
      continue;
    }
    const colon = line.indexOf(':');
    if (colon < 0) continue;
    const name = (line.slice(0, colon).split(';')[0] ?? '').toUpperCase();
    const value = line.slice(colon + 1);
    if (name === 'UID') current.uid = value.trim();
    else if (name === 'SUMMARY') current.summary = unescapeText(value);
    else if (name === 'STATUS') current.cancelled = value.trim().toUpperCase() === 'CANCELLED';
    else if (name === 'DTSTART') {
      const parsed = parseIcsDate(value);
      current.start = parsed.date;
      current.allDay = parsed.allDay;
    } else if (name === 'DTEND') current.end = parseIcsDate(value).date;
    else if (name === 'RRULE') current.rrule = new Map(value.split(';').map((part) => part.split('=') as [string, string]));
    else if (name === 'EXDATE') for (const item of value.split(',')) current.exdates.add(occurrenceKey(parseIcsDate(item).date));
  }
  return events;
}

const BYDAY = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'];
const MAX_OCCURRENCES = 1000;

/** Start times of an event, including repeats, up to `to` (inclusive, YYYY-MM-DD). */
function occurrences(event: RawEvent, to: string): Date[] {
  if (event.rrule === null) return [event.start];
  const freq = event.rrule.get('FREQ');
  if (freq !== 'DAILY' && freq !== 'WEEKLY') return [event.start];
  const interval = Number(event.rrule.get('INTERVAL') ?? 1);
  const count = event.rrule.has('COUNT') ? Number(event.rrule.get('COUNT')) : Infinity;
  const untilValue = event.rrule.get('UNTIL');
  const until = untilValue === undefined ? to : localDate(parseIcsDate(untilValue).date) < to ? localDate(parseIcsDate(untilValue).date) : to;
  const startDate = localDate(event.start);
  const startWeekday = (event.start.getDay() + 6) % 7;
  const byDay = (event.rrule.get('BYDAY') ?? '').split(',').filter(Boolean).map((day) => BYDAY.indexOf(day.slice(-2)));
  const weekdays = freq === 'WEEKLY' && byDay.length > 0 ? byDay : [startWeekday];
  const result: Date[] = [];
  const at = (date: string) => {
    const d = parseLocalDate(date);
    d.setHours(event.start.getHours(), event.start.getMinutes(), 0, 0);
    return d;
  };
  if (freq === 'DAILY') {
    for (let date = startDate; date <= until && result.length < count && result.length < MAX_OCCURRENCES; date = addDays(date, interval)) result.push(at(date));
    return result;
  }
  const firstMonday = addDays(startDate, -startWeekday);
  for (let week = 0; result.length < count && result.length < MAX_OCCURRENCES; week += interval) {
    const monday = addDays(firstMonday, week * 7);
    if (monday > until) break;
    for (const weekday of [...weekdays].sort()) {
      const date = addDays(monday, weekday);
      if (date < startDate || date > until || result.length >= count) continue;
      result.push(at(date));
    }
  }
  return result;
}

/** Timed, not cancelled appointments between `from` and `to` (inclusive, YYYY-MM-DD). */
export function readCalendar(text: string, from: string, to: string): CalendarEvent[] {
  const events: CalendarEvent[] = [];
  for (const event of parseEvents(text)) {
    if (event.allDay || event.cancelled) continue;
    const durationMin = event.end === null ? 60 : Math.max(5, Math.round((event.end.getTime() - event.start.getTime()) / 60000));
    for (const start of occurrences(event, to)) {
      const date = localDate(start);
      if (date < from || date > to || event.exdates.has(occurrenceKey(start))) continue;
      events.push({ uid: event.uid, summary: event.summary, date, startTime: minutesToTime(start.getHours() * 60 + start.getMinutes()), durationMin });
    }
  }
  return events.sort((a, b) => `${a.date} ${a.startTime}`.localeCompare(`${b.date} ${b.startTime}`));
}

const words = (text: string) => text.toLocaleLowerCase().split(/[^\p{L}\p{N}]+/u).filter(Boolean);

/** The one patient whose first name appears as a word in the event title, else null. */
export function matchPatient<T extends { id: string; firstName: string }>(summary: string, patients: T[]): T | null {
  const titleWords = new Set(words(summary));
  const matches = patients.filter((patient) => {
    const nameWords = words(patient.firstName);
    return nameWords.length > 0 && nameWords.every((word) => titleWords.has(word));
  });
  return matches.length === 1 ? (matches[0] ?? null) : null;
}

export const eventKey = (event: CalendarEvent) => `${event.uid} ${event.date} ${event.startTime}`;
