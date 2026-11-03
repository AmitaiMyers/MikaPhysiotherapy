import type { ReactNode } from 'react';
import { Link, useNavigate } from 'react-router';
import { getMuscle, getNerve } from '../data';
import type { NerveSupply } from '../data/types';
import { formatRoots } from '../domain/relations';

export function PageHeader({ title, subtitle, back, actions }: { title: ReactNode; subtitle?: ReactNode; back?: boolean; actions?: ReactNode }) {
  const navigate = useNavigate();
  return (
    <header className="page-header">
      {back && (
        <button type="button" className="icon-button" onClick={() => navigate(-1)} aria-label="Back">
          ‹
        </button>
      )}
      <div className="page-heading">
        <h1 className="page-title">{title}</h1>
        {subtitle !== undefined && <p className="page-subtitle">{subtitle}</p>}
      </div>
      {actions !== undefined && <div className="page-actions">{actions}</div>}
    </header>
  );
}

/** A titled card with a bullet list; renders nothing when the list is empty. */
export function BulletSection({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <section className="card">
      <h2>{title}</h2>
      <ul className="bullets">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  );
}

export function Card({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <section className="card">
      {title !== undefined && <h2>{title}</h2>}
      {children}
    </section>
  );
}

export function Note({ children }: { children: ReactNode }) {
  return (
    <p className="note">
      <span aria-hidden="true">ⓘ </span>
      {children}
    </p>
  );
}

export function MuscleLink({ id }: { id: string }) {
  return (
    <Link className="chip-link" to={`/muscles/${id}`}>
      {getMuscle(id).name}
    </Link>
  );
}

export function NerveSupplyLine({ supply }: { supply: NerveSupply }) {
  return (
    <span>
      <Link to={`/nerves/${supply.nerveId}`}>{getNerve(supply.nerveId).name}</Link> <span className="roots">({formatRoots(supply.roots)})</span>
    </span>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="empty">{children}</p>;
}

export const DISCLAIMER = 'For education and quick reference. Not a substitute for clinical assessment and judgement.';

export function Disclaimer() {
  return <p className="disclaimer">{DISCLAIMER}</p>;
}
