import { useEffect, useState } from 'react';

export interface JumpItem {
  /** The id of the anchor element to scroll to. */
  id: string;
  label: string;
  /** Full name for screen readers when the label is a letter (S, O, T…). */
  ariaLabel?: string;
}

/** How far below the top of the screen a section counts as "current" (the sticky bars above it). */
const ACTIVE_OFFSET = 140;

/** The section whose anchor was passed last while scrolling down. */
function useCurrentSection(ids: string[]): string | null {
  const [current, setCurrent] = useState<string | null>(null);
  const key = ids.join(',');
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const passed = ids.filter((id) => {
        const element = document.getElementById(id);
        return element !== null && element.getBoundingClientRect().top <= ACTIVE_OFFSET;
      });
      setCurrent(passed.at(-1) ?? null);
    };
    const onScroll = () => {
      if (frame === 0) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(frame);
    };
    // The key stands for the ids; the array is new on every render.
  }, [key]);
  return current;
}

/** A sticky row of chips that scroll to the sections of a long page and show where you are. */
export function JumpBar({ items, compact = false, label = 'Jump to section' }: { items: JumpItem[]; compact?: boolean; label?: string }) {
  const current = useCurrentSection(items.map((item) => item.id));
  return (
    <nav className={`jump-bar ${compact ? 'jump-bar-compact' : ''}`} aria-label={label}>
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          className={`jump-chip ${current === item.id ? 'jump-chip-current' : ''}`}
          aria-label={item.ariaLabel}
          aria-current={current === item.id ? 'location' : undefined}
          onClick={() => {
            const target = document.getElementById(item.id);
            // A closed disclosure opens, so the jump lands on its content.
            if (target instanceof HTMLDetailsElement) target.open = true;
            target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }}
        >
          {item.label}
        </button>
      ))}
    </nav>
  );
}
