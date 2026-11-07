// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { confirmAction, showToast, toastWithUndo } from '../feedback/store';
import { ActionButton, DialogHost, Toaster } from './feedback';

afterEach(cleanup);

describe('feedback components', () => {
  it('shows a toast with its action and dismisses it after the action', () => {
    const undo = vi.fn();
    render(<Toaster />);
    act(() => toastWithUndo('Template deleted', undo));
    expect(screen.getByRole('status').textContent).toContain('Template deleted');
    fireEvent.click(screen.getByRole('button', { name: /Undo/ }));
    expect(undo).toHaveBeenCalledOnce();
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('announces errors assertively', () => {
    render(<Toaster />);
    act(() => showToast('Couldn’t save to the device', { tone: 'error' }));
    expect(screen.getByRole('alert').textContent).toContain('Couldn’t save');
  });

  it('asks in a sheet and resolves with the button pressed', async () => {
    render(<DialogHost />);
    let answer: Promise<boolean> = Promise.resolve(false);
    act(() => {
      answer = confirmAction({ title: 'Delete Dana?', message: 'Her sessions are deleted.', confirmLabel: 'Delete patient' });
    });
    expect(screen.getByRole('dialog', { name: 'Delete Dana?' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Delete patient/ }));
    await expect(answer).resolves.toBe(true);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('shows busy, then success, on an action button', async () => {
    let finish: () => void = () => undefined;
    render(
      <ActionButton onRun={() => new Promise<void>((resolve) => (finish = resolve))} done="Exported">
        Export
      </ActionButton>,
    );
    const button = screen.getByRole('button', { name: 'Export' });
    fireEvent.click(button);
    expect(button.getAttribute('aria-busy')).toBe('true');
    await act(async () => finish());
    expect(button.textContent).toBe('Exported');
    expect(button.getAttribute('data-state')).toBe('success');
  });
});
