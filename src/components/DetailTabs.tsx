import { useEffect, useRef, useState } from 'react';
import type { MuscleImage } from '../data/images';
import { Segmented } from './Segmented';
import { Note } from './ui';

/** Horizontally scrolling section tabs of a detail page; keeps the active tab in view (e.g. when opened from a link). */
export function TabStrip<T extends string>({ tabs, active, onSelect }: { tabs: readonly { id: T; label: string }[]; active: T; onSelect: (id: T) => void }) {
  const activeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }, [active]);
  return (
    <nav className="tabs" aria-label="Sections">
      {tabs.map((t) => (
        <button
          key={t.id}
          ref={t.id === active ? activeRef : undefined}
          type="button"
          className={`tab ${t.id === active ? 'tab-active' : ''}`}
          aria-current={t.id === active ? 'page' : undefined}
          onClick={() => onSelect(t.id)}
        >
          {t.label}
        </button>
      ))}
    </nav>
  );
}

/** Rendered pictures of a structure with a switcher between its views. */
export function Gallery({ images, emptyMessage }: { images: MuscleImage[]; emptyMessage: string }) {
  const [index, setIndex] = useState(0);
  const current = images[index];
  if (!current) return <Note>{emptyMessage}</Note>;
  return (
    <figure className="gallery">
      <div className="image-frame">
        <img src={current.url} alt={current.caption} width={800} height={1000} />
      </div>
      <figcaption>{current.caption}</figcaption>
      {images.length > 1 && (
        <Segmented label="View" value={String(index)} onChange={(i) => setIndex(Number(i))} options={images.map((image, i) => ({ value: String(i), label: image.label }))} />
      )}
    </figure>
  );
}
