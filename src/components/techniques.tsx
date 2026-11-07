import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { thumbnailUrl } from '../data/images';
import { areaNames, EVIDENCE_GRADES, getReference, REFERENCE_KINDS, TECHNIQUE_FAMILIES } from '../data/techniques';
import type { EvidenceGrade } from '../data/techniqueTypes';
import { familyName } from '../techniques/catalog';
import { useTechniqueContent } from '../techniques/store';
import { allTechniqueViews, linkedTechniques, type AnatomyLink, type TechniqueView } from '../techniques/view';

/** Built-in and custom techniques, recomputed only when Mika's content changes. */
export function useTechniqueViews(): TechniqueView[] {
  const { techniques } = useTechniqueContent();
  return useMemo(() => allTechniqueViews(techniques), [techniques]);
}

export function EvidenceBadge({ grade }: { grade: EvidenceGrade }) {
  const { label, description } = EVIDENCE_GRADES[grade];
  return (
    <span className={`grade grade-${grade}`} title={description}>
      {label}
    </span>
  );
}

export function TechniqueRows({ views }: { views: TechniqueView[] }) {
  return (
    <ul className="muscle-list">
      {views.map((view) => {
        const featured = view.muscleIds[0];
        const thumb = featured === undefined ? null : thumbnailUrl(featured);
        return (
          <li key={view.id}>
            <Link to={`/techniques/${view.id}`} className="muscle-row">
              {thumb ? <img src={thumb} alt="" className="thumb" loading="lazy" width={56} height={56} /> : <span className="thumb thumb-empty" aria-hidden="true" />}
              <span className="muscle-row-text">
                <span className="muscle-row-name">{view.name}</span>
                <span className="muscle-row-meta">
                  {view.custom !== null ? 'My technique · ' : ''}
                  {familyName(view.familyId)} · {areaNames(view.areas)}
                </span>
              </span>
              <span className="chevron" aria-hidden="true">
                ›
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

/** Techniques grouped by family, for anatomy and exercise pages; nothing when there are none. */
export function TechniquesCard({ views, title = 'Techniques' }: { views: TechniqueView[]; title?: string }) {
  if (views.length === 0) return null;
  const groups = [...TECHNIQUE_FAMILIES.map((f) => ({ id: f.id as string, name: f.name })), { id: 'other', name: familyName(null) }]
    .map((group) => ({ ...group, views: views.filter((v) => (v.familyId ?? 'other') === group.id) }))
    .filter((group) => group.views.length > 0);
  return (
    <section className="card list-card">
      <h2>
        {title} ({views.length})
      </h2>
      {groups.map((group) => (
        <div key={group.id}>
          <h3 className="subheading">{group.name}</h3>
          <TechniqueRows views={group.views} />
        </div>
      ))}
    </section>
  );
}

/** Numbered references with their type, each linking to the paper. */
export function ReferenceList({ refIds }: { refIds: string[] }) {
  if (refIds.length === 0) return null;
  return (
    <ol className="bullets sources reference-list">
      {refIds.map((id) => {
        const reference = getReference(id);
        return (
          <li key={id}>
            <a href={reference.url} target="_blank" rel="noreferrer">
              {reference.citation}
            </a>{' '}
            <span className="muted small">— {REFERENCE_KINDS[reference.kind]}</span>
          </li>
        );
      })}
    </ol>
  );
}

/** Short reference links ("Guideline 2023") under an evidence finding. */
export function ReferenceChips({ refIds }: { refIds: string[] }) {
  if (refIds.length === 0) return null;
  return (
    <span className="reference-chips">
      {refIds.map((id) => {
        const reference = getReference(id);
        return (
          <a key={id} href={reference.url} target="_blank" rel="noreferrer" className="reference-chip" title={reference.citation}>
            {REFERENCE_KINDS[reference.kind]} {reference.year}
          </a>
        );
      })}
    </span>
  );
}

/** The techniques for a muscle, joint, bone, nerve or exercise, as shown on that page. */
export function LinkedTechniquesCard({ link, title }: { link: AnatomyLink; title?: string }) {
  const views = linkedTechniques(useTechniqueViews(), link);
  return <TechniquesCard views={views} title={title} />;
}

/** References hidden behind a button, like the sources on other pages, so they do not crowd the page. */
export function ReferencesSection({ refIds, reviewed }: { refIds: string[]; reviewed: string | null }) {
  const [open, setOpen] = useState(false);
  if (refIds.length === 0) return null;
  return (
    <section className="sources-section">
      <button type="button" className="button" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        {open ? 'Hide references' : `Show references (${refIds.length})`}
      </button>
      {open && (
        <section className="card">
          <ReferenceList refIds={refIds} />
          {reviewed !== null && <p className="muted small">Evidence reviewed {reviewed}.</p>}
        </section>
      )}
    </section>
  );
}
