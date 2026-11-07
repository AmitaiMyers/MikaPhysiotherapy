import type { VideoRef } from '../data/exerciseTypes';
import { createLocalStore } from './localStore';
import { defaultVideo } from './videos';

/** Key (exercise id, or "technique:<id>") → the user's chosen video; null means removed on purpose. */
type VideoOverrides = Readonly<Record<string, VideoRef | null>>;

const store = createLocalStore<VideoOverrides>('mika.videoOverrides', {});

export function setVideoOverride(key: string, video: VideoRef | null): void {
  store.set({ ...store.get(), [key]: video });
}

/** Go back to the built-in default video (or none). */
export function resetVideoOverride(key: string): void {
  const next = { ...store.get() };
  delete next[key];
  store.set(next);
}

/** A built-in video and where it comes from, e.g. "From Squat University". */
export interface VideoDefault {
  video: VideoRef;
  label: string;
}

export interface VideoChoice {
  /** The key the user's choice is saved under. */
  key: string;
  /** The user's video, else the built-in default, else null. */
  video: VideoRef | null;
  hasDefault: boolean;
  /** Whether the user replaced or removed the default. */
  overridden: boolean;
  /** Where the shown video comes from, when it is the built-in default. */
  sourceLabel: string | null;
}

export function useVideoChoice(key: string, fallback: VideoDefault | null): VideoChoice {
  const overrides = store.use();
  const overridden = key in overrides;
  // An override holding null means the user removed the video, so it must win over the default.
  const video = overridden ? (overrides[key] ?? null) : (fallback?.video ?? null);
  return { key, video, hasDefault: fallback !== null, overridden, sourceLabel: overridden || fallback === null ? null : fallback.label };
}

export function useExerciseVideo(exerciseId: string): VideoChoice {
  const found = defaultVideo(exerciseId);
  return useVideoChoice(exerciseId, found === null ? null : { video: found.video, label: found.channel === null ? 'Default video' : `From ${found.channel.name}` });
}
