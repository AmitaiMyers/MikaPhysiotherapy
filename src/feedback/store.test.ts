import { describe, expect, it, vi } from 'vitest';
import { closeDialog, confirmAction, currentFeedback, dismissToast, showToast, toastWithUndo, trackWrite } from './store';

describe('feedback store', () => {
  it('keeps one toast at a time and dismisses only the current one', () => {
    showToast('First');
    const first = currentFeedback().toast;
    showToast('Second', { tone: 'neutral' });
    expect(currentFeedback().toast?.message).toBe('Second');
    dismissToast(first?.id ?? -1);
    expect(currentFeedback().toast?.message).toBe('Second');
    dismissToast(currentFeedback().toast?.id ?? -1);
    expect(currentFeedback().toast).toBeNull();
  });

  it('offers Undo that runs the given restore', () => {
    const undo = vi.fn();
    toastWithUndo('Session deleted', undo);
    currentFeedback().toast?.action?.run();
    expect(undo).toHaveBeenCalledOnce();
  });

  it('resolves a confirmation with the answer', async () => {
    const answer = confirmAction({ title: 'Delete?', message: 'Gone for good.', confirmLabel: 'Delete' });
    const dialog = currentFeedback().dialog;
    expect(dialog?.kind).toBe('confirm');
    closeDialog();
    if (dialog?.kind === 'confirm') dialog.resolve(true);
    await expect(answer).resolves.toBe(true);
  });

  it('reports saving, saved and failed writes', async () => {
    let finish: () => void = () => undefined;
    trackWrite(new Promise<void>((resolve) => (finish = resolve)));
    expect(currentFeedback().save).toBe('saving');
    finish();
    await Promise.resolve();
    await Promise.resolve();
    expect(currentFeedback().save).toBe('saved');
    trackWrite(Promise.reject(new Error('Disk full')));
    await Promise.resolve();
    await Promise.resolve();
    expect(currentFeedback().save).toBe('failed');
    expect(currentFeedback().saveError).toBe('Disk full');
    expect(currentFeedback().toast?.tone).toBe('error');
  });
});
