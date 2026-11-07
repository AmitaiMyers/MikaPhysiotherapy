import { toastWithUndo } from '../../../feedback/store';

/** Immutable list edits used by the session editor sections. */

export function replaceAt<T>(list: T[], index: number, patch: Partial<T>): T[] {
  return list.map((item, i) => (i === index ? { ...item, ...patch } : item));
}

export function removeAt<T>(list: T[], index: number): T[] {
  return list.filter((_, i) => i !== index);
}

/**
 * Remove an entry at once and offer Undo, which puts the list back as it was. `apply` must merge
 * into the latest saved session, so Undo restores only this list.
 */
export function removeWithUndo<T>(list: T[], index: number, apply: (next: T[]) => void, what: string): void {
  apply(removeAt(list, index));
  toastWithUndo(`${what} removed`, () => apply(list));
}
