/**
 * What the 3D body explorer shows: how many muscle layers are peeled away, the selected structure,
 * the muscles made see-through, the muscle in focus and the camera. Kept outside the component, so
 * it survives leaving the Home tab and coming back.
 */
import { useSyncExternalStore } from 'react';
import depths from '../data/generated/muscleDepth.json';
import type { BodyTarget } from '../data/bodyMap';

/** Written by scripts/anatomy/muscle-depth.mjs: muscle id → layer, 0 = surface. */
const MUSCLE_DEPTH: Readonly<Record<string, number>> = depths;

/** Slider stops: 0 shows every muscle, each step peels one layer, the last stop is the bare skeleton. */
export const SKELETON_DEPTH = Math.max(...Object.values(MUSCLE_DEPTH)) + 1;

export interface CameraPose {
  position: [number, number, number];
  target: [number, number, number];
}

export interface ExplorerState {
  /** Muscle layers peeled away, 0 … SKELETON_DEPTH. */
  depth: number;
  selected: BodyTarget | null;
  /** Muscle ids drawn see-through. */
  seeThrough: string[];
  /** The muscle in focus: every other muscle is faded to a ghost. */
  focused: string | null;
  /** Where the camera was left; null frames the whole body from the front. */
  camera: CameraPose | null;
  /** Set when another page asks to show the selected structure: the explorer flies there once, then clears it. */
  flyToSelected: boolean;
}

export const INITIAL_STATE: ExplorerState = { depth: 0, selected: null, seeThrough: [], focused: null, camera: null, flyToSelected: false };

/** How a muscle is drawn. */
export type MuscleLook = 'solid' | 'glass' | 'ghost' | 'hidden';

export function depthLabel(depth: number): string {
  if (depth === 0) return 'All muscles';
  if (depth === SKELETON_DEPTH) return 'Skeleton';
  return `${depth} ${depth === 1 ? 'layer' : 'layers'} removed`;
}

/**
 * The look of one muscle. A see-through muscle is glass and the muscle in focus is solid, even when
 * their layer is peeled away (they were chosen explicitly); otherwise a peeled muscle is hidden, and
 * while a muscle is in focus the rest are ghosts.
 */
export function muscleLook(state: ExplorerState, muscleId: string): MuscleLook {
  const depth = MUSCLE_DEPTH[muscleId];
  if (depth === undefined) throw new Error(`No depth layer for muscle "${muscleId}" — run scripts/anatomy/muscle-depth.mjs`);
  if (state.seeThrough.includes(muscleId)) return 'glass';
  if (state.focused === muscleId) return 'solid';
  if (depth < state.depth) return 'hidden';
  return state.focused === null ? 'solid' : 'ghost';
}

export const isSameTarget = (a: BodyTarget | null, b: BodyTarget | null) => a?.kind === b?.kind && a?.id === b?.id;

// ---------- transitions ----------

export function withDepth(state: ExplorerState, depth: number): ExplorerState {
  if (!Number.isInteger(depth) || depth < 0 || depth > SKELETON_DEPTH) throw new Error(`Depth ${depth} is outside 0–${SKELETON_DEPTH}`);
  return { ...state, depth };
}

/** Tapping the selected structure again, or empty space, clears the selection. */
export function withTap(state: ExplorerState, target: BodyTarget | null): ExplorerState {
  return { ...state, selected: target === null || isSameTarget(state.selected, target) ? null : target };
}

export function withSeeThroughToggled(state: ExplorerState, muscleId: string): ExplorerState {
  const seeThrough = state.seeThrough.includes(muscleId) ? state.seeThrough.filter((id) => id !== muscleId) : [...state.seeThrough, muscleId];
  return { ...state, seeThrough };
}

export function withFocusToggled(state: ExplorerState, muscleId: string): ExplorerState {
  return { ...state, focused: state.focused === muscleId ? null : muscleId };
}

/**
 * Show a tendon on the body from another page: select it, focus its muscle (so the tendon is not
 * hidden by peeled layers or other muscles) and ask the explorer to fly to it.
 */
export function withTendonShown(state: ExplorerState, tendonId: string, muscleId: string): ExplorerState {
  return { ...state, selected: { kind: 'tendon', id: tendonId }, focused: muscleId, seeThrough: state.seeThrough.filter((id) => id !== muscleId), flyToSelected: true };
}

/** The explorer has flown to the structure another page asked for. */
export function withFlightDone(state: ExplorerState): ExplorerState {
  return { ...state, flyToSelected: false };
}

/** Every muscle back to its normal look: nothing see-through, nothing in focus. The layers stay as set. */
export function withLooksReset(state: ExplorerState): ExplorerState {
  return { ...state, seeThrough: [], focused: null };
}

// ---------- store ----------

let current = INITIAL_STATE;
const listeners = new Set<() => void>();

export function getExplorerState(): ExplorerState {
  return current;
}

export function updateExplorer(change: (state: ExplorerState) => ExplorerState): void {
  current = change(current);
  for (const listener of listeners) listener();
}

/** Remember the camera without re-rendering anyone: only the next mount reads it. */
export function rememberCamera(camera: CameraPose | null): void {
  current = { ...current, camera };
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useExplorerState(): ExplorerState {
  return useSyncExternalStore(subscribe, getExplorerState);
}
