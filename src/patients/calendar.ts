/** Calendar arithmetic: times, weeks, recurring bookings and laying out overlapping sessions. */
import { addDays, parseLocalDate } from './dates';

export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return (hours ?? 0) * 60 + (minutes ?? 0);
}

export function minutesToTime(total: number): string {
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

/** Monday of the week containing the date. */
export function weekStart(date: string): string {
  const weekday = (parseLocalDate(date).getDay() + 6) % 7;
  return addDays(date, -weekday);
}

export function weekDays(date: string): string[] {
  const monday = weekStart(date);
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}

/** 0 = Monday … 6 = Sunday. */
export function weekdayIndex(date: string): number {
  return (parseLocalDate(date).getDay() + 6) % 7;
}

/**
 * Dates of a weekly booking: the first date, then every selected weekday (0 = Monday) for the given
 * number of weeks, counted from the first date's week.
 */
export function recurringDates(firstDate: string, weekdays: number[], weeks: number): string[] {
  const monday = weekStart(firstDate);
  const dates = new Set<string>([firstDate]);
  for (let week = 0; week < weeks; week++) {
    for (const weekday of weekdays) {
      const date = addDays(monday, week * 7 + weekday);
      if (date >= firstDate) dates.add(date);
    }
  }
  return [...dates].sort();
}

export interface Slot {
  start: number;
  end: number;
}

/**
 * Side-by-side lanes for overlapping items: each item gets a lane index and the number of lanes in
 * its overlapping group, so it can be drawn at width 1/lanes.
 */
export function layoutLanes<T extends Slot>(items: T[]): { item: T; lane: number; lanes: number }[] {
  const sorted = [...items].sort((a, b) => a.start - b.start || b.end - a.end);
  const result: { item: T; lane: number; lanes: number }[] = [];
  let group: { item: T; lane: number; lanes: number }[] = [];
  let groupEnd = -Infinity;
  const closeGroup = () => {
    const lanes = Math.max(1, ...group.map((g) => g.lane + 1));
    for (const g of group) result.push({ ...g, lanes });
    group = [];
  };
  for (const item of sorted) {
    if (item.start >= groupEnd) {
      closeGroup();
      groupEnd = -Infinity;
    }
    const used = new Set(group.filter((g) => g.item.end > item.start).map((g) => g.lane));
    let lane = 0;
    while (used.has(lane)) lane++;
    group.push({ item, lane, lanes: 1 });
    groupEnd = Math.max(groupEnd, item.end);
  }
  closeGroup();
  return result;
}
