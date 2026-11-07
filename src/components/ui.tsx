import { useState, type ReactNode } from 'react';
import { Icon, type IconName } from './Icon';
import { useOnlineStatus } from './useOnlineStatus';
import { Link, useNavigate } from 'react-router';
import { getMuscle, getNerve, getSource } from '../data';
import type { NerveSupply } from '../data/types';
import { formatRoots } from '../domain/relations';
import type { ShareResult } from '../domain/share';

export function PageHeader({ title, subtitle, back, actions }: { title: ReactNode; subtitle?: ReactNode; back?: boolean; actions?: ReactNode }) {
  const navigate = useNavigate();
  return (
    <header className="page-header">
      {back && (
        <button type="button" className="icon-button" onClick={() => navigate(-1)} aria-label="Back">
          <Icon name="back" />
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
      <Icon name="info" size={16} />
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

/** What a list shows before it has anything: an icon, one sentence, and the action that adds the first item. */
export function EmptyState({ icon, children, action }: { icon: IconName; children: ReactNode; action?: ReactNode }) {
  return (
    <div className="empty-state">
      <span className="empty-state-icon">
        <Icon name={icon} size={26} />
      </span>
      <p className="empty-state-text">{children}</p>
      {action}
    </div>
  );
}

/** A slim bar while the device is offline; everything stored on the device keeps working. */
export function OfflineBar() {
  const online = useOnlineStatus();
  if (online) return null;
  return (
    <p className="offline-bar" role="status">
      <Icon name="info" size={16} /> Offline — videos and web links open when you’re back online.
    </p>
  );
}

export const DISCLAIMER = 'For education and quick reference. Not a substitute for clinical assessment and judgement.';

export function Disclaimer() {
  return <p className="disclaimer">{DISCLAIMER}</p>;
}

/** Sources are hidden behind a button so they do not crowd the page. */
export function SourcesSection({ sourceIds }: { sourceIds: string[] }) {
  const [open, setOpen] = useState(false);
  return (
    <section className="sources-section">
      <button type="button" className="button" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        {open ? 'Hide sources' : `Show sources (${sourceIds.length})`}
      </button>
      {open && (
        <Card>
          <ul className="bullets sources">
            {sourceIds.map((id) => {
              const source = getSource(id);
              return (
                <li key={id}>
                  {source.url ? (
                    <a href={source.url} target="_blank" rel="noreferrer">
                      {source.citation}
                    </a>
                  ) : (
                    source.citation
                  )}
                </li>
              );
            })}
          </ul>
        </Card>
      )}
    </section>
  );
}

/** Header button that shares, briefly confirming when the text was copied instead. */
export function ShareButton({ label, onShare }: { label: string; onShare: () => Promise<ShareResult> }) {
  const [message, setMessage] = useState<string | null>(null);
  const share = async () => {
    const result = await onShare();
    if (result !== 'copied') return;
    setMessage('Copied');
    window.setTimeout(() => setMessage(null), 2000);
  };
  return (
    <button type="button" className="icon-button" onClick={() => void share()} aria-label={label}>
      {message ?? <Icon name="share" />}
    </button>
  );
}

export type BadgeTone = 'neutral' | 'accent' | 'success' | 'attention' | 'danger' | 'info';

/** A small non-interactive label; status tones always carry an icon as well as the word. */
export function Badge({ tone, children }: { tone: BadgeTone; children: ReactNode }) {
  const icon: IconName | null = tone === 'success' ? 'check' : tone === 'danger' ? 'alert' : null;
  return (
    <span className={`badge badge-${tone}`}>
      {icon !== null && <Icon name={icon} size={14} />}
      {children}
    </span>
  );
}

/** "Planned" (needs Mika soon) or "Done". */
export function SessionStatusBadge({ status }: { status: 'planned' | 'done' }) {
  return status === 'done' ? <Badge tone="success">Done</Badge> : <Badge tone="attention">Planned</Badge>;
}
