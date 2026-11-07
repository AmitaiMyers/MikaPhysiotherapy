import { useEffect, useRef, useState, type ReactNode } from 'react';
import { closeDialog, dismissToast, showToast, useFeedback, type ConfirmRequest, type PromptRequest } from '../feedback/store';
import { retryFailedWrites } from '../patients/vault';
import { Icon, type IconName } from './Icon';
import { Modal } from './Modal';

const TOAST_MS = 4000;
const TOAST_WITH_ACTION_MS = 6000;

/** The one toast, above the bottom navigation. Error toasts stay until dismissed. */
export function Toaster() {
  const { toast } = useFeedback();
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (toast === null || toast.tone === 'error' || paused) return;
    const timer = window.setTimeout(() => dismissToast(toast.id), toast.action === null ? TOAST_MS : TOAST_WITH_ACTION_MS);
    return () => window.clearTimeout(timer);
  }, [toast, paused]);
  return (
    <div className="toast-region" aria-live="polite">
      {toast !== null && (
        <div
          key={toast.id}
          className={`toast toast-${toast.tone}`}
          role={toast.tone === 'error' ? 'alert' : 'status'}
          onPointerEnter={() => setPaused(true)}
          onPointerLeave={() => setPaused(false)}
        >
          <Icon name={toast.tone === 'error' ? 'alert' : 'check'} size={18} />
          <span className="toast-text">{toast.message}</span>
          {toast.action !== null && (
            <button
              type="button"
              className="toast-action"
              onClick={() => {
                toast.action?.run();
                dismissToast(toast.id);
              }}
            >
              {toast.action.label === 'Undo' && <Icon name="undo" size={18} />}
              {toast.action.label}
            </button>
          )}
          <button type="button" className="toast-close" aria-label="Dismiss" onClick={() => dismissToast(toast.id)}>
            <Icon name="close" size={16} />
          </button>
        </div>
      )}
    </div>
  );
}

/** Confirm and prompt sheets requested with confirmAction() / promptText(). */
export function DialogHost() {
  const { dialog } = useFeedback();
  if (dialog === null) return null;
  return dialog.kind === 'confirm' ? <ConfirmSheet request={dialog} /> : <PromptSheet request={dialog} />;
}

function ConfirmSheet({ request }: { request: ConfirmRequest }) {
  const answer = (confirmed: boolean) => {
    closeDialog();
    request.resolve(confirmed);
  };
  return (
    <Modal title={request.title} onClose={() => answer(false)}>
      <p>{request.message}</p>
      <div className="sheet-actions">
        <button type="button" className="button" onClick={() => answer(false)} autoFocus>
          Keep
        </button>
        <button type="button" className={`button ${request.destructive ? 'button-destructive' : 'button-primary'}`} onClick={() => answer(true)}>
          {request.destructive && <Icon name="trash" size={18} />}
          {request.confirmLabel}
        </button>
      </div>
    </Modal>
  );
}

function PromptSheet({ request }: { request: PromptRequest }) {
  const [value, setValue] = useState(request.initial);
  const answer = (result: string | null) => {
    closeDialog();
    request.resolve(result);
  };
  return (
    <Modal title={request.title} onClose={() => answer(null)}>
      <form
        className="vault-form"
        onSubmit={(event) => {
          event.preventDefault();
          answer(value.trim());
        }}
      >
        <label className="field">
          <span>{request.label}</span>
          <input className="search-input" value={value} onChange={(event) => setValue(event.target.value)} autoFocus required />
        </label>
        <div className="sheet-actions">
          <button type="button" className="button" onClick={() => answer(null)}>
            Cancel
          </button>
          <button type="submit" className="button button-primary" disabled={value.trim() === ''}>
            {request.confirmLabel}
          </button>
        </div>
      </form>
    </Modal>
  );
}

/** "Saving… / Saved / Not saved — retry" beside the title of screens that save on every change. */
export function SaveStatus() {
  const { save } = useFeedback();
  const [visible, setVisible] = useState(save);
  // "Saved" fades after 2 s; the other states show as long as they last.
  useEffect(() => {
    setVisible(save);
    if (save !== 'saved') return;
    const timer = window.setTimeout(() => setVisible('idle'), 2000);
    return () => window.clearTimeout(timer);
  }, [save]);
  if (visible === 'failed') {
    return (
      <button type="button" className="save-status save-status-failed" role="alert" onClick={retryFailedWrites}>
        <Icon name="alert" size={16} /> Not saved — retry
      </button>
    );
  }
  return (
    <span className={`save-status save-status-${visible}`} role="status">
      {visible === 'saving' && (
        <>
          <Icon name="spinner" size={16} spin /> Saving…
        </>
      )}
      {visible === 'saved' && (
        <>
          <Icon name="check" size={16} /> Saved
        </>
      )}
    </span>
  );
}

/** Placeholder rows shaped like a list while it loads. */
export function SkeletonRows({ count = 3, label }: { count?: number; label: string }) {
  return (
    <ul className="muscle-list skeleton-list" aria-busy="true" aria-label={label}>
      {Array.from({ length: count }, (_, i) => (
        <li key={i} className="muscle-row">
          <span className="thumb skeleton" />
          <span className="muscle-row-text skeleton-text">
            <span className="skeleton skeleton-title" style={{ width: `${70 - i * 12}%` }} />
            <span className="skeleton skeleton-line" style={{ width: `${85 - i * 10}%` }} />
          </span>
        </li>
      ))}
    </ul>
  );
}

/**
 * A button for work that takes a moment: a spinner while it runs, then a check and the past
 * tense ("Saved") for 1.6 s. A failure shows its message in an error toast.
 */
export function ActionButton({ onRun, children, done, icon, primary = false }: { onRun: () => Promise<unknown>; children: ReactNode; done: string; icon?: IconName; primary?: boolean }) {
  const [state, setState] = useState<'idle' | 'busy' | 'success'>('idle');
  const mounted = useRef(true);
  useEffect(
    () => () => {
      mounted.current = false;
    },
    [],
  );
  const run = () => {
    setState('busy');
    onRun().then(
      () => {
        if (!mounted.current) return;
        setState('success');
        window.setTimeout(() => mounted.current && setState('idle'), 1600);
      },
      (error: unknown) => {
        if (mounted.current) setState('idle');
        showToast(error instanceof Error ? error.message.replace(/^Assertion failed: /, '') : 'That didn’t work — try again.', { tone: 'error' });
      },
    );
  };
  return (
    <button type="button" className={`button ${primary ? 'button-primary' : ''}`} aria-busy={state === 'busy'} data-state={state === 'success' ? 'success' : undefined} onClick={run}>
      {state === 'busy' ? <Icon name="spinner" size={18} spin /> : state === 'success' ? <Icon name="check" size={18} /> : icon !== undefined && <Icon name={icon} size={18} />}
      {state === 'success' ? done : children}
    </button>
  );
}
