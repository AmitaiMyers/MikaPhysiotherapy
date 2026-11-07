import { Link } from 'react-router';
import { Empty, SessionStatusBadge } from '../../components/ui';
import { formatDate } from '../../patients/dates';
import { sortSessionsNewestFirst } from '../../patients/sessions';
import type { Episode, Session } from '../../patients/types';
import { Icon } from '../../components/Icon';

function sessionSummary(session: Session): string {
  const pain = session.subjective.pain.activity ?? session.subjective.pain.rest;
  const parts = [
    pain === null ? null : `Pain ${pain}/10`,
    session.techniques.length > 0 ? `${session.techniques.length} ${session.techniques.length === 1 ? 'technique' : 'techniques'}` : null,
    session.exercises.length > 0 ? `${session.exercises.length} exercises` : null,
    session.objective.tests.length > 0 ? `${session.objective.tests.length} tests` : null,
    session.assessment.split('\n')[0] || null,
  ];
  return parts.filter(Boolean).join(' · ');
}

/** Upcoming planned sessions first (soonest first), then past sessions (newest first). */
export function SessionList({ sessions, episodes }: { sessions: Session[]; episodes: Episode[] }) {
  if (sessions.length === 0) return <Empty>No sessions yet.</Empty>;
  const planned = sortSessionsNewestFirst(sessions.filter((s) => s.status === 'planned')).reverse();
  const done = sortSessionsNewestFirst(sessions.filter((s) => s.status === 'done'));
  return (
    <section className="card list-card">
      <ul className="muscle-list">
        {[...planned, ...done].map((session) => (
          <li key={session.id}>
            <Link to={`/patients/sessions/${session.id}`} className="muscle-row">
              <span className={`date-badge ${session.status === 'planned' ? 'date-badge-planned' : ''}`} aria-hidden="true">
                <span>{new Date(`${session.date}T00:00`).getDate()}</span>
                <span className="date-badge-month">{new Date(`${session.date}T00:00`).toLocaleDateString(undefined, { month: 'short' })}</span>
              </span>
              <span className="muscle-row-text">
                <span className="muscle-row-name">
                  {formatDate(session.date)} · {session.startTime}
                  {session.status === 'planned' && <SessionStatusBadge status="planned" />}
                </span>
                <span className="muscle-row-meta">{[episodes.find((e) => e.id === session.episodeId)?.title, sessionSummary(session)].filter(Boolean).join(' · ') || '—'}</span>
              </span>
              <span className="chevron" aria-hidden="true">
                <Icon name="chevron" size={18} />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
