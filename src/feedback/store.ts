/**
 * App-wide feedback: the one toast on screen, the confirm / prompt sheet waiting for an answer,
 * and the writes in flight (for the save status). Screens call these functions; the hosts in
 * FeedbackHost render them.
 */
import { useSyncExternalStore } from 'react';

export type ToastTone = 'success' | 'neutral' | 'error';

export interface ToastAction {
  label: string;
  run: () => void;
}

export interface Toast {
  id: number;
  message: string;
  tone: ToastTone;
  action: ToastAction | null;
}

export interface ConfirmRequest {
  kind: 'confirm';
  title: string;
  message: string;
  confirmLabel: string;
  destructive: boolean;
  resolve: (confirmed: boolean) => void;
}

export interface PromptRequest {
  kind: 'prompt';
  title: string;
  label: string;
  initial: string;
  confirmLabel: string;
  resolve: (value: string | null) => void;
}

export type DialogRequest = ConfirmRequest | PromptRequest;

export type SaveState = 'idle' | 'saving' | 'saved' | 'failed';

export interface FeedbackState {
  toast: Toast | null;
  dialog: DialogRequest | null;
  pendingWrites: number;
  save: SaveState;
  /** The last failed write, until the next successful one. */
  saveError: string | null;
}

let state: FeedbackState = { toast: null, dialog: null, pendingWrites: 0, save: 'idle', saveError: null };
const listeners = new Set<() => void>();
let nextToastId = 1;

function set(patch: Partial<FeedbackState>): void {
  state = { ...state, ...patch };
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export const useFeedback = (): FeedbackState => useSyncExternalStore(subscribe, () => state);
export const currentFeedback = (): FeedbackState => state;

// ---------- toasts ----------

/** Show a toast, replacing the current one. */
export function showToast(message: string, options: { tone?: ToastTone; action?: ToastAction } = {}): void {
  set({ toast: { id: nextToastId++, message, tone: options.tone ?? 'success', action: options.action ?? null } });
}

export function dismissToast(id: number): void {
  if (state.toast?.id === id) set({ toast: null });
}

/** A confirmation with Undo, for deletions that happen at once. */
export function toastWithUndo(message: string, undo: () => void): void {
  showToast(message, { action: { label: 'Undo', run: undo } });
}

// ---------- dialogs (replace window.confirm / window.prompt) ----------

export function confirmAction(options: { title: string; message: string; confirmLabel: string; destructive?: boolean }): Promise<boolean> {
  return new Promise((resolve) => set({ dialog: { kind: 'confirm', destructive: true, ...options, resolve } }));
}

export function promptText(options: { title: string; label: string; initial: string; confirmLabel: string }): Promise<string | null> {
  return new Promise((resolve) => set({ dialog: { kind: 'prompt', ...options, resolve } }));
}

export function closeDialog(): void {
  set({ dialog: null });
}

// ---------- writes (save status) ----------

/** Follow a storage write: "Saving…" while pending, "Saved" after, "Not saved" with the reason on failure. */
export function trackWrite(write: Promise<unknown>): void {
  set({ pendingWrites: state.pendingWrites + 1, save: 'saving' });
  write.then(
    () => {
      const pendingWrites = state.pendingWrites - 1;
      set({ pendingWrites, save: pendingWrites > 0 ? 'saving' : state.saveError === null ? 'saved' : 'failed' });
    },
    (error: unknown) => {
      set({ pendingWrites: state.pendingWrites - 1, save: 'failed', saveError: error instanceof Error ? error.message : String(error) });
      showToast('Couldn’t save to the device', { tone: 'error' });
    },
  );
}

/** Clear a failure once the user has seen it and a later write succeeded. */
export function clearSaveError(): void {
  set({ saveError: null, save: state.pendingWrites > 0 ? 'saving' : 'idle' });
}

/** A short vibration on Android for confirmations that matter; silently nothing elsewhere. */
export function buzz(): void {
  // Typed as always present, but missing on iOS Safari and desktop browsers.
  if (typeof navigator.vibrate === 'function') navigator.vibrate(10);
}
