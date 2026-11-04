import { Link, useParams } from 'react-router';
import { RehabTabs } from '../components/RehabTabs';
import { BulletSection, Disclaimer, Empty, PageHeader, ShareButton, SourcesSection } from '../components/ui';
import { useUrlParams } from '../components/useUrlParams';
import { getExercise } from '../data/exercises';
import type { Protocol, ProtocolKind, ProtocolPhase } from '../data/protocolTypes';
import { findProtocol, getProtocolArea, getProtocolRegion, PROTOCOL_DISCLAIMER, PROTOCOL_KIND_LABELS, PROTOCOL_REGIONS, PROTOCOLS } from '../data/protocols';
import { matchesWords } from '../domain/search';
import { shareProtocol } from '../domain/share';

const KIND_SUBTITLE: Record<ProtocolKind, string> = {
  fracture: 'fracture protocols · by body region',
  surgery: 'post-operative protocols · by body region',
};

const matchesProtocol = (protocol: Protocol, text: string) => matchesWords(text, [protocol.name, protocol.management, ...protocol.aliases]);

export function ProtocolListPage({ kind }: { kind: ProtocolKind }) {
  const [values, update] = useUrlParams({ text: 'q' });
  const text = values.text ?? '';
  const ofKind = PROTOCOLS.filter((p) => p.kind === kind);
  const results = ofKind.filter((p) => matchesProtocol(p, text));

  return (
    <div className="page">
      <PageHeader title="Rehab" subtitle={`${ofKind.length} ${KIND_SUBTITLE[kind]}`} />
      <RehabTabs />
      <input
        type="search"
        className="search-input"
        placeholder={`Search ${PROTOCOL_KIND_LABELS[kind].toLowerCase()}`}
        value={text}
        onChange={(event) => update({ text: event.target.value })}
        aria-label={`Search ${PROTOCOL_KIND_LABELS[kind].toLowerCase()}`}
      />
      {results.length === 0 && <Empty>No protocol matches this search.</Empty>}
      {PROTOCOL_REGIONS.map((region) => {
        const inRegion = results.filter((p) => p.regionId === region.id);
        if (inRegion.length === 0) return null;
        return (
          <details key={region.id} className="region" open>
            <summary className="region-summary">
              <span>{region.name}</span>
              <span className="count">{inRegion.length}</span>
            </summary>
            {region.areas.map((area) => {
              const inArea = inRegion.filter((p) => p.areaId === area.id);
              if (inArea.length === 0) return null;
              return (
                <section key={area.id} className="card list-card">
                  <h2 className="list-card-title">{area.name}</h2>
                  <ul className="muscle-list">
                    {inArea.map((protocol) => (
                      <li key={protocol.id}>
                        <ProtocolRow protocol={protocol} />
                      </li>
                    ))}
                  </ul>
                </section>
              );
            })}
          </details>
        );
      })}
      <p className="disclaimer">Protocols summarise common practice and published guidance. {PROTOCOL_DISCLAIMER.operative}</p>
    </div>
  );
}

function ProtocolRow({ protocol }: { protocol: Protocol }) {
  return (
    <Link to={`/rehab/protocols/${protocol.id}`} className="muscle-row">
      <span className="muscle-row-text">
        <span className="muscle-row-name">{protocol.name}</span>
        <span className="muscle-row-meta">
          {protocol.management} · {protocol.phases.length} phases
        </span>
      </span>
      <span className="chevron" aria-hidden="true">
        ›
      </span>
    </Link>
  );
}

export function ProtocolDetailPage() {
  const { id = '' } = useParams();
  const protocol = findProtocol(id);
  if (!protocol) return <Empty>Protocol not found.</Empty>;
  const disclaimer = PROTOCOL_DISCLAIMER[protocol.treatment];
  return (
    <div className="page" key={protocol.id}>
      <PageHeader back title={protocol.name} subtitle={protocol.management} actions={<ShareButton label="Share protocol" onShare={() => shareProtocol(protocol, disclaimer)} />} />
      <p className="breadcrumb">
        <Link to={protocol.kind === 'fracture' ? '/rehab/fractures' : '/rehab/surgeries'}>{PROTOCOL_KIND_LABELS[protocol.kind]}</Link> › {getProtocolRegion(protocol.regionId).name} ›{' '}
        {getProtocolArea(protocol.areaId).name}
      </p>
      <aside className="caution-box" role="note">
        <strong>{disclaimer}</strong> Timeframes are typical; progress by the criteria, not by the calendar alone.
      </aside>
      <p className="summary">{protocol.summary}</p>
      {protocol.aliases.length > 0 && (
        <p className="muted">
          <strong>Also called:</strong> {protocol.aliases.join(', ')}
        </p>
      )}
      <BulletSection title="Key points" items={protocol.keyPoints} />
      <h2 className="section-heading">Phases</h2>
      {protocol.phases.map((phase, index) => (
        <PhaseCard key={phase.name} phase={phase} number={index + 1} defaultOpen={index === 0} />
      ))}
      <BulletSection title="Return to activity and sport" items={protocol.returnToActivity} />
      <BulletSection title="Outcome measures" items={protocol.outcomeMeasures} />
      <BulletSection title="Where protocols differ" items={protocol.notes} />
      <SourcesSection sourceIds={protocol.sourceIds} />
      <Disclaimer />
    </div>
  );
}

function PhaseCard({ phase, number, defaultOpen }: { phase: ProtocolPhase; number: number; defaultOpen: boolean }) {
  return (
    <details className="card group phase" open={defaultOpen}>
      <summary className="group-summary">
        <span className="phase-number" aria-hidden="true">
          {number}
        </span>
        <span className="phase-title">
          <span className="group-name">{phase.name}</span>
          <span className="phase-timeframe">{phase.timeframe}</span>
        </span>
      </summary>
      <div className="phase-body">
        <PhaseList title="Goals" items={phase.goals} />
        <PhaseList title="Weight bearing, brace & range" items={phase.protection} />
        <PhaseList title="Precautions" items={phase.precautions} />
        <h3 className="subheading">Exercises</h3>
        <ul className="link-list">
          {phase.exercises.map((item) => (
            <li key={item.exerciseId}>
              <Link to={`/rehab/exercises/${item.exerciseId}`}>{getExercise(item.exerciseId).name}</Link>
              {item.note !== undefined && <span className="muted small"> — {item.note}</span>}
            </li>
          ))}
        </ul>
        <PhaseList title="Criteria to progress" items={phase.criteria} />
      </div>
    </details>
  );
}

function PhaseList({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <>
      <h3 className="subheading">{title}</h3>
      <ul className="bullets">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </>
  );
}
