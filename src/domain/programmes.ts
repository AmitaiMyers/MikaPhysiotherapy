import type { Exercise } from '../data/exerciseTypes';

/** Pure helpers for home exercise programmes (no storage, so they are easy to test). */

export interface ProgrammeItem {
  exerciseId: string;
  dosage: string;
  note: string;
}

export interface Programme {
  id: string;
  title: string;
  notes: string;
  items: ProgrammeItem[];
  /** ISO date-time of the last change, for sorting. */
  updatedAt: string;
}

/** A programme item starting from the exercise's typical dosage. */
export function itemFor(exercise: Exercise, note = ''): ProgrammeItem {
  return { exerciseId: exercise.id, dosage: exercise.dosage, note };
}

/** Add items, skipping exercises already in the programme. */
export function withItems(programme: Programme, items: ProgrammeItem[], now: string): Programme {
  const present = new Set(programme.items.map((item) => item.exerciseId));
  const added = items.filter((item) => !present.has(item.exerciseId));
  return { ...programme, items: [...programme.items, ...added], updatedAt: now };
}

/** Move the item at `index` one place up (-1) or down (+1); out-of-range moves are ignored. */
export function moveItem(programme: Programme, index: number, direction: -1 | 1, now: string): Programme {
  const target = index + direction;
  if (target < 0 || target >= programme.items.length) return programme;
  const items = [...programme.items];
  const [moved] = items.splice(index, 1);
  if (moved === undefined) throw new Error(`No programme item at index ${index}`);
  items.splice(target, 0, moved);
  return { ...programme, items, updatedAt: now };
}

/** Plain-text programme for messaging apps: each exercise with its steps, dosage and note. */
export function programmeShareText(programme: Programme, getExercise: (id: string) => Exercise): string {
  const lines = [programme.title];
  if (programme.notes.trim() !== '') lines.push(programme.notes.trim());
  programme.items.forEach((item, index) => {
    const exercise = getExercise(item.exerciseId);
    lines.push('', `${index + 1}. ${exercise.name}`, `Position: ${exercise.position}`, ...exercise.steps.map((step) => `– ${step}`), `Dosage: ${item.dosage}`);
    if (item.note.trim() !== '') lines.push(`Note: ${item.note.trim()}`);
  });
  lines.push('', 'Stop and contact your physiotherapist if an exercise causes sharp or increasing pain.');
  return lines.join('\n');
}

export function whatsAppUrl(text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}
