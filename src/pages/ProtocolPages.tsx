import { Link, useParams } from 'react-router';
import { AddToProgramme } from '../components/AddToProgramme';
import { RehabTabs } from '../components/RehabTabs';
import { Icon } from '../components/Icon';
import { JumpBar } from '../components/JumpBar';
import { Segmented } from '../components/Segmented';
import { BulletSection, Disclaimer, Empty, EmptyState, PageHeader, ShareButton, SourcesSection } from '../components/ui';
import { conditionsForProtocol } from '../techniques/view';
import { useUrlParams } from '../components/useUrlParams';
import { getExercise } from '../data/exercises';
import type { Protocol, ProtocolKind, ProtocolPhase } from '../data/protocolTypes';
import { findProtocol, getProtocolArea, getProtocolRegion, PROTOCOL_DISCLAIMER, PROTOCOL_KIND_LABELS, PROTOCOL_REGIONS, PROTOCOLS } from '../data/protocols';
import { matchesWords } from '../domain/search';
import { itemFor } from '../domain/programmes';
import { shareProtocol } from '../domain/share';

type KindFilter = ProtocolKind | 'all';

const KIND_OPTIONS: { value: KindFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'fracture', label: 'Fractures' },
  { value: 'surgery', label: 'Surgeries' },
];

const KIND_SINGULAR: Record<ProtocolKind, string> = { fracture: 'Fracture', surgery: 'Surgery' };

const matchesProtocol = (protocol: Protocol, text: string) => matchesWords(text, [protocol.name, protocol.management, ...protocol.aliases]);

/** Fracture and surgery protocols in one list, filtered by kind and search, grouped by body region. */
export function ProtocolListPage() {
  const [values, update] = useUrlParams({ text: 'q', kind: 'kind' });
  const text = values.text ?? '';
  const kind: KindFilter = values.kind === 'fracture' || values.kind === 'surgery' ? values.kind : 'all';
  const ofKind = kind === 'all' ? PROTOCOLS : PROTOCOLS.filter((p) => p.kind === kind);
  const results = ofKind.filter((p) => matchesProtocol(p, text));
  const fractures = PROTOCOLS.filter((p) => p.kind === 'fracture').length;

  return (
    <div className="page">
      <PageHeader title="Rehab" subtitle={`${PROTOCOLS.length} protocols · ${fractures} fractures, ${PROTOCOLS.length - fractures} surgeries`} />
      <RehabTabs />
      <Segmented label="Protocol type" value={kind} onChange={(k) => update({ kind: k === 'all' ? null : k })} options={KIND_OPTIONS} />
      <input type="search" className="search-input" placeholder="Search protocols" value={text} onChange={(event) => update({ text: event.target.value })} aria-label="Search protocols" />
      {results.length === 0 && <EmptyState icon="search">No protocol matches this search.</EmptyState>}
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
          {KIND_SINGULAR[protocol.kind]} · {protocol.management} · {protocol.phases.length} phases
        </span>
      </span>
      <span className="chevron" aria-hidden="true">
        <Icon name="chevron" size={18} />
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
        <Link to={`/rehab/protocols?kind=${protocol.kind}`}>{PROTOCOL_KIND_LABELS[protocol.kind]}</Link> › {getProtocolRegion(protocol.regionId).name} ›{' '}
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
      <JumpBar items={protocol.phases.map((phase, index) => ({ id: `phase-${index + 1}`, label: `${index + 1}. ${phase.name}` }))} label="Jump to phase" />
      <BulletSection title="Key points" items={protocol.keyPoints} />
      <h2 className="section-heading">Phases</h2>
      {protocol.phases.map((phase, index) => (
        <PhaseCard key={phase.name} protocol={protocol} phase={phase} number={index + 1} defaultOpen={index === 0} />
      ))}
      <BulletSection title="Return to activity and sport" items={protocol.returnToActivity} />
      <BulletSection title="Outcome measures" items={protocol.outcomeMeasures} />
      <BulletSection title="Where protocols differ" items={protocol.notes} />
      <ProtocolConditions protocolId={protocol.id} />
      <SourcesSection sourceIds={protocol.sourceIds} />
      <Disclaimer />
    </div>
  );
}

function PhaseCard({ protocol, phase, number, defaultOpen }: { protocol: Protocol; phase: ProtocolPhase; number: number; defaultOpen: boolean }) {
  return (
    <details id={`phase-${number}`} className="card group phase" open={defaultOpen}>
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
        <AddToProgramme
          items={phase.exercises.map((item) => itemFor(getExercise(item.exerciseId), item.note))}
          defaultTitle={`${protocol.name} — ${phase.name}`}
          defaultNotes={[...phase.protection, PROTOCOL_DISCLAIMER[protocol.treatment]].join('\n')}
          label="Add this phase to a programme"
        />
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

/** Conditions linked to the protocol (e.g. knee stiffness after TKA), opening their techniques. */
function ProtocolConditions({ protocolId }: { protocolId: string }) {
  const conditions = conditionsForProtocol(protocolId);
  if (conditions.length === 0) return null;
  return (
    <section className="card">
      <h2>Hands-on techniques</h2>
      <p className="small muted">Evidence-graded techniques for related problems:</p>
      <ul className="link-list">
        {conditions.map((condition) => (
          <li key={condition.id}>
            <Link to={`/techniques/conditions/${condition.id}`}>{condition.name}</Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
