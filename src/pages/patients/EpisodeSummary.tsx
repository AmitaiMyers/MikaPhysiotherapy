import { Link } from 'react-router';
import { getProtocol } from '../../data/protocols';
import { protocolPosition } from '../../data/protocols/timing';
import { daysBetween } from '../../patients/dates';
import type { Episode } from '../../patients/types';

/** "Week 5 since surgery · Phase 2: Early strength", or a prompt to set the start date. */
export function ProtocolProgress({ episode, today }: { episode: Episode; today: string }) {
  if (episode.protocolId === null) return null;
  const protocol = getProtocol(episode.protocolId);
  const link = (
    <Link to={`/rehab/protocols/${protocol.id}`}>
      {protocol.name} — {protocol.management}
    </Link>
  );
  if (episode.startDate === null) return <p className="small">{link} · set the surgery or injury date to see the current phase.</p>;
  const days = daysBetween(episode.startDate, today);
  if (days < 0) return <p className="small">{link} · starts in {-days} days.</p>;
  const position = protocolPosition(protocol, days);
  const phase = position.phaseIndex === null ? null : protocol.phases[position.phaseIndex];
  return (
    <p className="small">
      {link}
      <br />
      <strong>Week {position.week}</strong> (day {days}) ·{' '}
      {phase === undefined || phase === null ? 'phase depends on events such as cast removal — choose it in the session' : `Phase ${(position.phaseIndex ?? 0) + 1}: ${phase.name} (${phase.timeframe})`}
    </p>
  );
}

export const SIDE_LABELS = { left: 'Left', right: 'Right', both: 'Both sides', none: '—' } as const;
