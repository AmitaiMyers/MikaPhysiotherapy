import { lazy, Suspense, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router';
import { Gallery, TabStrip } from '../components/DetailTabs';
import { ExerciseList } from '../components/ExerciseList';
import { ResultCard, RowGroup } from '../components/ImageRows';
import { LigamentLink, LigamentRow } from '../components/ligaments';
import { LibraryTabs } from '../components/LibraryTabs';
import { LinkedTechniquesCard } from '../components/techniques';
import { BulletSection, Card, Disclaimer, Empty, EmptyState, MuscleLink, Note, PageHeader, ShareButton, SourcesSection } from '../components/ui';
import { useUrlParams } from '../components/useUrlParams';
import { BONES, getBone, getJoint, getNerve, getRegion, getSpecialTest, JOINTS, REGIONS } from '../data';
import { getExercise } from '../data/exercises';
import { ligamentViews } from '../data/images';
import { findLigament, ligamentGroup, LIGAMENT_GROUPS, LIGAMENTS } from '../data/ligaments';
import { getProtocol } from '../data/protocols';
import type { Ligament, LigamentKind, LigamentRestraint } from '../data/types';
import { coRestraints, filterLigaments, hasActiveLigamentFilters, KIND_LABELS, type LigamentFilters } from '../domain/ligaments';
import { actionKey } from '../domain/search';
import { shareLigament } from '../domain/share';
import { ProtocolRow } from './ProtocolPages';

const LigamentViewer = lazy(() => import('../viewer/LigamentViewer'));

const NO_IMAGE = 'The open 3D atlases do not model this structure, so there is no picture.';

// ---------- list ----------

const USED_JOINTS = JOINTS.filter((joint) => LIGAMENTS.some((l) => l.jointIds.includes(joint.id)));
const USED_BONES = BONES.filter((bone) => LIGAMENTS.some((l) => l.attachments.some((a) => a.bones.includes(bone.id))));
const USED_KINDS = (Object.keys(KIND_LABELS) as LigamentKind[]).filter((kind) => LIGAMENTS.some((l) => l.kind === kind));
const MOTION_OPTIONS = [...new Map(LIGAMENTS.flatMap((l) => l.restraints).map((r) => [actionKey(r.jointId, r.motion), `${getJoint(r.jointId).name}: ${r.motion}`])).entries()]
  .map(([key, label]) => ({ key, label }))
  .sort((a, b) => a.label.localeCompare(b.label));

/** Filters live in the URL so a filtered list can be shared and survives going back. */
function useFilters(): [LigamentFilters, (patch: Partial<LigamentFilters>) => void, () => void] {
  const [values, update, clear] = useUrlParams({ text: 'q', jointId: 'joint', boneId: 'bone', kind: 'kind', restrains: 'restrains' });
  const kind = USED_KINDS.find((k) => k === values.kind) ?? null;
  return [{ ...values, text: values.text ?? '', kind }, update, clear];
}

/** Ligaments grouped by region and joint like the muscle list, with search and filters. */
export function LigamentsPage() {
  const [filters, update, clear] = useFilters();
  const [showFilters, setShowFilters] = useState(hasActiveLigamentFilters({ ...filters, text: '' }));
  const active = hasActiveLigamentFilters(filters);
  const results = filterLigaments(LIGAMENTS, filters);
  return (
    <div className="page">
      <PageHeader title="Ligaments" subtitle={`${LIGAMENTS.length} ligaments, capsules, menisci & discs · by joint`} />
      <LibraryTabs />
      <div className="search-row">
        <input type="search" className="search-input" placeholder="Search name, Latin name or synonym" value={filters.text} onChange={(event) => update({ text: event.target.value })} aria-label="Search ligaments" />
        <button type="button" className={`button ${showFilters ? 'button-active' : ''}`} onClick={() => setShowFilters((v) => !v)} aria-expanded={showFilters}>
          Filters
        </button>
      </div>
      {showFilters && <FilterPanel filters={filters} update={update} />}
      {active ? (
        results.length === 0 ? (
          <EmptyState icon="search" action={<button type="button" className="button" onClick={clear}>Clear filters</button>}>
            No ligament matches these filters.
          </EmptyState>
        ) : (
          <ResultCard title={`${results.length} ${results.length === 1 ? 'structure' : 'structures'}`}>
            {results.map((ligament) => (
              <LigamentRow key={ligament.id} ligament={ligament} showGroup />
            ))}
          </ResultCard>
        )
      ) : (
        <GroupedList />
      )}
      <Disclaimer />
    </div>
  );
}

function FilterPanel({ filters, update }: { filters: LigamentFilters; update: (patch: Partial<LigamentFilters>) => void }) {
  return (
    <section className="card filter-panel" aria-label="Filters">
      <label className="field">
        <span>Joint</span>
        <select value={filters.jointId ?? ''} onChange={(e) => update({ jointId: e.target.value || null })}>
          <option value="">Any joint</option>
          {USED_JOINTS.map((joint) => (
            <option key={joint.id} value={joint.id}>
              {joint.name}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        <span>Restrains</span>
        <select value={filters.restrains ?? ''} onChange={(e) => update({ restrains: e.target.value || null })}>
          <option value="">Any motion</option>
          {MOTION_OPTIONS.map((option) => (
            <option key={option.key} value={option.key}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        <span>Attaches to</span>
        <select value={filters.boneId ?? ''} onChange={(e) => update({ boneId: e.target.value || null })}>
          <option value="">Any bone</option>
          {USED_BONES.map((bone) => (
            <option key={bone.id} value={bone.id}>
              {bone.name}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        <span>Type</span>
        <select value={filters.kind ?? ''} onChange={(e) => update({ kind: USED_KINDS.find((k) => k === e.target.value) ?? null })}>
          <option value="">Any type</option>
          {USED_KINDS.map((kind) => (
            <option key={kind} value={kind}>
              {KIND_LABELS[kind]}
            </option>
          ))}
        </select>
      </label>
    </section>
  );
}

function GroupedList() {
  return (
    <>
      {REGIONS.map((region) => {
        const inRegion = LIGAMENTS.filter((l) => l.regionId === region.id);
        return (
          <details key={region.id} className="region" open={inRegion.length > 0}>
            <summary className="region-summary">
              <span>{region.name}</span>
              <span className="count">{inRegion.length > 0 ? inRegion.length : 'Coming soon'}</span>
            </summary>
            {inRegion.length === 0 ? (
              <Empty>This region will be added in a later phase.</Empty>
            ) : (
              LIGAMENT_GROUPS[region.id].map((group) => {
                const inGroup = inRegion.filter((l) => l.groupId === group.id);
                if (inGroup.length === 0) return null;
                return (
                  <RowGroup key={group.id} name={group.name} count={inGroup.length}>
                    {inGroup.map((ligament) => (
                      <LigamentRow key={ligament.id} ligament={ligament} showGroup={false} />
                    ))}
                  </RowGroup>
                );
              })
            )}
          </details>
        );
      })}
    </>
  );
}

// ---------- detail ----------

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'attachments', label: 'Attachments' },
  { id: 'function', label: 'Function' },
  { id: 'supply', label: 'Nerve & blood' },
  { id: 'clinical', label: 'Clinical' },
  { id: 'assessment', label: 'Assessment' },
  { id: 'rehab', label: 'Rehab' },
  { id: 'techniques', label: 'Techniques' },
  { id: '3d', label: '3D' },
] as const;
type TabId = (typeof TABS)[number]['id'];

export function LigamentDetailPage() {
  const { id = '' } = useParams();
  const ligament = findLigament(id);
  const [params, setParams] = useSearchParams();
  const tab: TabId = TABS.find((t) => t.id === params.get('tab'))?.id ?? 'overview';
  if (!ligament) return <Empty>Ligament not found.</Empty>;
  // Keyed by ligament so per-ligament state (selected picture, 3D camera) resets when following a link.
  return (
    <div className="page" key={ligament.id}>
      <PageHeader back title={ligament.name} subtitle={ligament.latinName} actions={<ShareButton label="Share ligament" onShare={() => shareLigament(ligament)} />} />
      <p className="breadcrumb">
        {getRegion(ligament.regionId).name} › {ligamentGroup(ligament).name} › {KIND_LABELS[ligament.kind]}
      </p>
      <TabStrip tabs={TABS} active={tab} onSelect={(next) => setParams({ tab: next }, { replace: true })} />
      {tab === 'overview' && <OverviewTab ligament={ligament} />}
      {tab === 'attachments' && <AttachmentsTab ligament={ligament} />}
      {tab === 'function' && <FunctionTab ligament={ligament} />}
      {tab === 'supply' && <SupplyTab ligament={ligament} />}
      {tab === 'clinical' && <ClinicalTab ligament={ligament} />}
      {tab === 'assessment' && <AssessmentTab ligament={ligament} />}
      {tab === 'rehab' && <RehabTab ligament={ligament} />}
      {tab === 'techniques' && <LinkedTechniquesCard link={{ kind: 'ligament', id: ligament.id }} title="Techniques for its joints" />}
      {tab === '3d' && (
        <Suspense fallback={<p className="muted center">Loading 3D viewer…</p>}>
          <LigamentViewer ligamentId={ligament.id} />
        </Suspense>
      )}
      <Disclaimer />
    </div>
  );
}

function OverviewTab({ ligament }: { ligament: Ligament }) {
  return (
    <>
      <p className="summary">{ligament.summary}</p>
      <Gallery images={ligamentViews(ligament.id)} emptyMessage={NO_IMAGE} />
      {ligament.synonyms.length > 0 && (
        <p className="muted">
          <strong>Also called:</strong> {ligament.synonyms.join(', ')}
        </p>
      )}
      <Card title="Joints">
        <span className="chips">
          {ligament.jointIds.map((jointId) => (
            <Link key={jointId} to={`/joints/${jointId}`} className="chip-link">
              {getJoint(jointId).name}
            </Link>
          ))}
        </span>
      </Card>
      <BulletSection title="Anatomy & structure" items={ligament.structure} />
      <BulletSection title="Function" items={ligament.functions} />
      <SourcesSection sourceIds={ligament.sourceIds} />
    </>
  );
}

function AttachmentsTab({ ligament }: { ligament: Ligament }) {
  return (
    <>
      {ligament.attachments.map((attachment) => (
        <Card key={`${attachment.end}-${attachment.text}`} title={attachment.end}>
          <p>{attachment.text}</p>
          {attachment.bones.length > 0 && (
            <span className="bone-tags">
              {attachment.bones.map((boneId) => (
                <Link key={boneId} to={`/bones/${boneId}`} className="tag">
                  {getBone(boneId).name}
                </Link>
              ))}
            </span>
          )}
        </Card>
      ))}
      <BulletSection title="Variations" items={ligament.variationNotes} />
    </>
  );
}

function RestraintCard({ ligament, restraint }: { ligament: Ligament; restraint: LigamentRestraint }) {
  const others = coRestraints(ligament, restraint);
  return (
    <li className="action-card">
      <div className="action-title">
        <span className={`role role-${restraint.role === 'primary' ? 'prime' : 'assist'}`}>{restraint.role === 'primary' ? 'Primary restraint' : 'Secondary restraint'}</span>
        <strong>
          <Link to={`/joints/${restraint.jointId}`}>{getJoint(restraint.jointId).name}</Link>: {restraint.motion}
        </strong>
      </div>
      {restraint.note && <p className="muted">{restraint.note}</p>}
      <div className="related">
        <span className="related-label">Also restrained by</span>
        {others.length === 0 ? (
          <span className="muted">No other structure in the current data</span>
        ) : (
          <span className="chips">
            {others.map(({ ligament: other, restraint: r }) => (
              <LigamentLink key={other.id} id={other.id} secondary={r.role === 'secondary'} />
            ))}
          </span>
        )}
      </div>
    </li>
  );
}

function FunctionTab({ ligament }: { ligament: Ligament }) {
  return (
    <>
      {ligament.restraints.length === 0 ? (
        <Note>This structure does not restrain a joint motion; see its function in the Overview.</Note>
      ) : (
        <ul className="action-list">
          {ligament.restraints.map((restraint) => (
            <RestraintCard key={`${restraint.jointId}|${restraint.motion}`} ligament={ligament} restraint={restraint} />
          ))}
        </ul>
      )}
      {ligament.protectiveMuscleIds.length > 0 && (
        <Card title="Muscles that protect it">
          <p className="muted small">They resist the same motions dynamically, so strengthening them unloads the structure.</p>
          <span className="chips">
            {ligament.protectiveMuscleIds.map((id) => (
              <MuscleLink key={id} id={id} />
            ))}
          </span>
        </Card>
      )}
      <Note>Co-restraints are worked out from the restraints of every structure in the app. Outlined names are secondary restraints; filled names are primary.</Note>
    </>
  );
}

function SupplyTab({ ligament }: { ligament: Ligament }) {
  return (
    <>
      <Card title="Nerve supply">
        {ligament.nerveIds.length === 0 ? (
          <p className="muted">Not documented in the current data.</p>
        ) : (
          <>
            <p className="muted small">Articular branches carry pain and position sense (proprioception) from the structure.</p>
            <ul className="link-list">
              {ligament.nerveIds.map((nerveId) => (
                <li key={nerveId}>
                  <Link to={`/nerves/${nerveId}`}>{getNerve(nerveId).name}</Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </Card>
      <BulletSection title="Blood supply" items={ligament.bloodSupply} />
      <Card title="Healing">
        <p>{ligament.healing}</p>
      </Card>
    </>
  );
}

function ClinicalTab({ ligament }: { ligament: Ligament }) {
  return (
    <>
      <BulletSection title="Clinical significance" items={ligament.clinical} />
      <BulletSection title="Mechanism of injury" items={ligament.injuryMechanisms} />
      <BulletSection title="Grading & classification" items={ligament.grading} />
    </>
  );
}

function AssessmentTab({ ligament }: { ligament: Ligament }) {
  const nothing = ligament.palpation.length + ligament.specialTestIds.length + ligament.imaging.length === 0;
  return (
    <>
      {nothing && <Note>No specific assessment for this structure; assess its joint.</Note>}
      <BulletSection title="Palpation" items={ligament.palpation} />
      {ligament.specialTestIds.length > 0 && (
        <Card title="Special tests">
          <ul className="link-list">
            {ligament.specialTestIds.map((testId) => {
              const test = getSpecialTest(testId);
              return (
                <li key={testId}>
                  <Link to={`/tests/${testId}`}>{test.name}</Link>
                  <span className="muted"> — {test.purpose}</span>
                </li>
              );
            })}
          </ul>
        </Card>
      )}
      <BulletSection title="Imaging" items={ligament.imaging} />
    </>
  );
}

function RehabTab({ ligament }: { ligament: Ligament }) {
  if (ligament.exerciseIds.length === 0 && ligament.protocolIds.length === 0) return <Empty>No exercise or protocol in the Rehab tab targets this structure yet.</Empty>;
  return (
    <>
      {ligament.protocolIds.length > 0 && (
        <section className="card list-card">
          <h2 className="list-card-title">Protocols ({ligament.protocolIds.length})</h2>
          <ul className="muscle-list">
            {ligament.protocolIds.map((protocolId) => (
              <li key={protocolId}>
                <ProtocolRow protocol={getProtocol(protocolId)} />
              </li>
            ))}
          </ul>
        </section>
      )}
      {ligament.exerciseIds.length > 0 && (
        <section className="card list-card">
          <h2 className="list-card-title">Exercises ({ligament.exerciseIds.length})</h2>
          <ExerciseList exercises={ligament.exerciseIds.map(getExercise)} />
        </section>
      )}
      <Note>Exercises that load the structure progressively or strengthen the muscles that protect it. Follow the protocol and the patient’s stage of healing.</Note>
    </>
  );
}
