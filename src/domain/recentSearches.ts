import { createLocalStore } from './localStore';

const MAX = 6;

/** The last searches that led somewhere, newest first (this device only). */
const store = createLocalStore<string[]>('mika.recentSearches', []);

export const useRecentSearches = (): string[] => store.use();

export function rememberSearch(text: string): void {
  const query = text.trim();
  if (query === '') return;
  store.set([query, ...store.get().filter((q) => q.toLowerCase() !== query.toLowerCase())].slice(0, MAX));
}

export function clearRecentSearches(): void {
  store.set([]);
}
