import { createLocalStore } from './localStore';
import { moveItem, withItems, type Programme, type ProgrammeItem } from './programmes';

/** Home exercise programmes, saved on this device only. */
const store = createLocalStore<Programme[]>('mika.programmes', []);

const now = () => new Date().toISOString();

function replace(programme: Programme): void {
  store.set(store.get().map((p) => (p.id === programme.id ? programme : p)));
}

function current(id: string): Programme {
  const programme = store.get().find((p) => p.id === id);
  if (programme === undefined) throw new Error(`Unknown programme "${id}"`);
  return programme;
}

export const useProgrammes = (): Programme[] => store.use();

export function createProgramme(title: string, items: ProgrammeItem[] = [], notes = ''): Programme {
  const programme: Programme = { id: crypto.randomUUID(), title, notes, items, updatedAt: now() };
  store.set([programme, ...store.get()]);
  return programme;
}

/** Put back a deleted programme (Undo). */
export function restoreProgramme(programme: Programme): void {
  store.set([programme, ...store.get().filter((p) => p.id !== programme.id)]);
}

export function deleteProgramme(id: string): void {
  store.set(store.get().filter((p) => p.id !== id));
}

export function updateProgramme(id: string, patch: Partial<Pick<Programme, 'title' | 'notes'>>): void {
  replace({ ...current(id), ...patch, updatedAt: now() });
}

export function addToProgramme(id: string, items: ProgrammeItem[]): void {
  replace(withItems(current(id), items, now()));
}

export function updateItem(id: string, index: number, patch: Partial<Pick<ProgrammeItem, 'dosage' | 'note'>>): void {
  const programme = current(id);
  replace({ ...programme, items: programme.items.map((item, i) => (i === index ? { ...item, ...patch } : item)), updatedAt: now() });
}

export function removeItem(id: string, index: number): void {
  const programme = current(id);
  replace({ ...programme, items: programme.items.filter((_, i) => i !== index), updatedAt: now() });
}

export function moveProgrammeItem(id: string, index: number, direction: -1 | 1): void {
  replace(moveItem(current(id), index, direction, now()));
}
