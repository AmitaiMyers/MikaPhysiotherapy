import { useRef, type KeyboardEvent } from 'react';

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
  /** A longer name for screen readers when the label is short (e.g. "L" → "Left"). */
  ariaLabel?: string;
}

/**
 * Two to four mutually exclusive options that switch a view in place. A radio group: one tab stop,
 * arrow keys move the choice.
 */
export function Segmented<T extends string>({ label, options, value, onChange, className = '' }: { label: string; options: SegmentOption<T>[]; value: T | null; onChange: (value: T) => void; className?: string }) {
  const group = useRef<HTMLDivElement>(null);
  const move = (event: KeyboardEvent, index: number) => {
    const step = event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1 : event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -1 : 0;
    if (step === 0) return;
    event.preventDefault();
    const next = options[(index + step + options.length) % options.length];
    if (next === undefined) return;
    onChange(next.value);
    group.current?.querySelectorAll<HTMLButtonElement>('[role="radio"]')[options.indexOf(next)]?.focus();
  };
  const focusable = value === null || !options.some((o) => o.value === value) ? options[0]?.value : value;
  return (
    <div ref={group} className={`segmented ${className}`} role="radiogroup" aria-label={label}>
      {options.map((option, index) => {
        const checked = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={checked}
            aria-label={option.ariaLabel}
            tabIndex={option.value === focusable ? 0 : -1}
            className={checked ? 'segment-active' : ''}
            onClick={() => onChange(option.value)}
            onKeyDown={(event) => move(event, index)}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
