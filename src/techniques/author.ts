import { createLocalStore } from '../domain/localStore';

/** The name Mika signs her shared techniques and notes with, saved on this device. */
const authorStore = createLocalStore<string>('mika.authorName', 'Mika');

export const useAuthorName = (): string => authorStore.use();
export const authorName = (): string => authorStore.get();
export const setAuthorName = (name: string): void => authorStore.set(name.trim() === '' ? 'Mika' : name.trim());
