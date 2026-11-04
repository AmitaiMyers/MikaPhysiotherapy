import { useSyncExternalStore } from 'react';
import type { VideoRef } from '../data/exerciseTypes';
import { BUILT_IN_VIDEOS } from './videos';

/** exerciseId → the user's chosen video; null means the user removed the video on purpose. */
type VideoOverrides = Readonly<Record<string, VideoRef | null>>;

const STORAGE_KEY = 'mika.videoOverrides';
const listeners = new Set<() => void>();

function load(): VideoOverrides {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw === null ? {} : (JSON.parse(raw) as VideoOverrides);
}

// Kept in memory so React gets the same object until something changes.
let current: VideoOverrides = load();

function save(next: VideoOverrides): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  current = next;
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function setVideoOverride(exerciseId: string, video: VideoRef | null): void {
  save({ ...current, [exerciseId]: video });
}

/** Go back to the exercise's built-in default video (or none). */
export function resetVideoOverride(exerciseId: string): void {
  const next = { ...current };
  delete next[exerciseId];
  save(next);
}

export interface ExerciseVideoState {
  /** The user's video, else the built-in default, else null. */
  video: VideoRef | null;
  hasDefault: boolean;
  /** Whether the user replaced or removed the default. */
  overridden: boolean;
}

export function useExerciseVideo(exerciseId: string): ExerciseVideoState {
  const overrides = useSyncExternalStore(subscribe, () => current);
  const overridden = exerciseId in overrides;
  // An override holding null means the user removed the video, so it must win over the default.
  const video = overridden ? (overrides[exerciseId] ?? null) : (BUILT_IN_VIDEOS[exerciseId] ?? null);
  return { video, hasDefault: exerciseId in BUILT_IN_VIDEOS, overridden };
}
