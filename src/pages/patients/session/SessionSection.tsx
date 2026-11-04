import type { ReactNode } from 'react';

/** A collapsible session section; the count shows how many entries it holds. */
export function SessionSection({ letter, title, count, defaultOpen = false, children }: { letter?: string; title: string; count?: number; defaultOpen?: boolean; children: ReactNode }) {
  return (
    <details className="card group session-section" open={defaultOpen}>
      <summary className="group-summary">
        {letter !== undefined && (
          <span className="soap-letter" aria-hidden="true">
            {letter}
          </span>
        )}
        <span className="group-name">{title}</span>
        {count !== undefined && count > 0 && <span className="count">{count}</span>}
      </summary>
      <div className="phase-body">{children}</div>
    </details>
  );
}

/** A removable row inside a section. */
export function EntryRow({ title, onRemove, children }: { title: ReactNode; onRemove: () => void; children: ReactNode }) {
  return (
    <div className="entry-row">
      <div className="entry-row-header">
        <span className="entry-title">{title}</span>
        <button type="button" className="icon-button small-icon" aria-label="Remove" onClick={onRemove}>
          ×
        </button>
      </div>
      <div className="entry-fields">{children}</div>
    </div>
  );
}

export function SideSelect({ value, onChange }: { value: 'left' | 'right'; onChange: (side: 'left' | 'right') => void }) {
  return (
    <div className="segmented" role="group" aria-label="Side">
      {(['left', 'right'] as const).map((side) => (
        <button key={side} type="button" className={value === side ? 'segment-active' : ''} aria-pressed={value === side} onClick={() => onChange(side)}>
          {side === 'left' ? 'L' : 'R'}
        </button>
      ))}
    </div>
  );
}
