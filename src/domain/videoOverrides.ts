import type { VideoRef } from '../data/exerciseTypes';
import { createLocalStore } from './localStore';
import { defaultVideo, type DefaultVideo } from './videos';

/** exerciseId → the user's chosen video; null means the user removed the video on purpose. */
type VideoOverrides = Readonly<Record<string, VideoRef | null>>;

const store = createLocalStore<VideoOverrides>('mika.videoOverrides', {});

export function setVideoOverride(exerciseId: string, video: VideoRef | null): void {
  store.set({ ...store.get(), [exerciseId]: video });
}

/** Go back to the exercise's built-in default video (or none). */
export function resetVideoOverride(exerciseId: string): void {
  const next = { ...store.get() };
  delete next[exerciseId];
  store.set(next);
}

export interface ExerciseVideoState {
  /** The user's video, else the built-in default, else null. */
  video: VideoRef | null;
  hasDefault: boolean;
  /** Whether the user replaced or removed the default. */
  overridden: boolean;
  /** The default video and its channel, when the user has not replaced it. */
  source: DefaultVideo | null;
}

export function useExerciseVideo(exerciseId: string): ExerciseVideoState {
  const overrides = store.use();
  const overridden = exerciseId in overrides;
  // An override holding null means the user removed the video, so it must win over the default.
  const fallback = defaultVideo(exerciseId);
  const video = overridden ? (overrides[exerciseId] ?? null) : (fallback?.video ?? null);
  return { video, hasDefault: fallback !== null, overridden, source: overridden ? null : fallback };
}
