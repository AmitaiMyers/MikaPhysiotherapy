import type { ReactNode } from 'react';
import { Link } from 'react-router';
import type { MuscleImage } from '../data/images';
import { Icon } from './Icon';

/** A list row with the structure's thumbnail, like a muscle row. */
export function ImageRow({ to, thumb, name, meta }: { to: string; thumb: string | null; name: string; meta: string }) {
  return (
    <li>
      <Link to={to} className="muscle-row">
        {thumb !== null ? <img src={thumb} alt="" className="thumb" loading="lazy" width={56} height={56} /> : <span className="thumb thumb-empty" aria-hidden="true" />}
        <span className="muscle-row-text">
          <span className="muscle-row-name">{name}</span>
          <span className="muscle-row-meta">{meta}</span>
        </span>
        <span className="chevron" aria-hidden="true">
          <Icon name="chevron" size={18} />
        </span>
      </Link>
    </li>
  );
}

/** Search results: a titled card of image rows. */
export function ResultCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="card list-card">
      <h2>{title}</h2>
      <ul className="muscle-list">{children}</ul>
    </section>
  );
}

/** A collapsible group of image rows, like a muscle group. */
export function RowGroup({ name, count, children }: { name: string; count: number; children: ReactNode }) {
  return (
    <details className="card group">
      <summary className="group-summary">
        <span className="group-name">{name}</span>
        <span className="count">{count}</span>
      </summary>
      <ul className="muscle-list">{children}</ul>
    </details>
  );
}

/** The structure's picture at the top of its page, like a muscle's. */
export function StructureFigure({ image, alt }: { image: MuscleImage | null; alt: string }) {
  if (image === null) return null;
  return (
    <figure className="gallery">
      <div className="image-frame">
        <img src={image.url} alt={`${alt}, ${image.caption.toLowerCase()}`} width={800} height={1000} />
      </div>
      <figcaption>{image.caption}</figcaption>
    </figure>
  );
}
