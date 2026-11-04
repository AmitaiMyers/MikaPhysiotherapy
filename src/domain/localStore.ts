import { useSyncExternalStore } from 'react';

export interface LocalStore<T> {
  get: () => T;
  set: (next: T) => void;
  /** React hook returning the current value; re-renders when it changes. */
  use: () => T;
}

/**
 * A value saved as JSON in localStorage (this device only), kept in memory so React gets the
 * same object until it changes.
 */
export function createLocalStore<T>(key: string, initial: T): LocalStore<T> {
  const listeners = new Set<() => void>();
  const raw = localStorage.getItem(key);
  let current: T = raw === null ? initial : (JSON.parse(raw) as T);

  const subscribe = (listener: () => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };
  const get = () => current;
  const set = (next: T) => {
    localStorage.setItem(key, JSON.stringify(next));
    current = next;
    for (const listener of listeners) listener();
  };
  return { get, set, use: () => useSyncExternalStore(subscribe, get) };
}
