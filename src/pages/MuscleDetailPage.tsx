import { lazy, Suspense, useEffect, useRef, useState, type ReactNode } from 'react';
import { Link, useParams, useSearchParams } from 'react-router';
import { ExerciseList } from '../components/ExerciseList';
import { TechniquesCard, useTechniqueViews } from '../components/techniques';
import { linkedTechniques } from '../techniques/view';
import { BulletSection, Card, Disclaimer, Empty, MuscleLink, NerveSupplyLine, Note, PageHeader, ShareButton, SourcesSection } from '../components/ui';
import { findMuscle, getBone, getJoint, getRegion, getSpecialTest } from '../data';
import { exercisesForMuscle } from '../data/exercises';
import { attachmentImage, muscleViews, type MuscleImage } from '../data/images';
import type { Attachment, Muscle, MuscleAction } from '../data/types';
import { agonists, antagonists, formatRoots, type RelatedMuscle } from '../domain/relations';
import { required } from '../domain/assert';
import { shareMuscle } from '../domain/share';
import { Segmented } from '../components/Segmented';

const AnatomyViewer = lazy(() => import('../viewer/AnatomyViewer'));

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'attachments', label: 'Origin & insertion' },
  { id: 'supply', label: 'Nerve & blood' },
  { id: 'actions', label: 'Actions' },
  { id: 'clinical', label: 'Clinical' },
  { id: 'assessment', label: 'Assessment' },
  { id: 'exercises', label: 'Exercises' },
  { id: 'techniques', label: 'Techniques' },
  { id: '3d', label: '3D' },
] as const;
type TabId = (typeof TABS)[number]['id'];

export function MuscleDetailPage() {
  const { id = '' } = useParams();
  const muscle = findMuscle(id);
  const [params, setParams] = useSearchParams();
  const tab = (TABS.find((t) => t.id === params.get('tab'))?.id ?? 'overview') as TabId;
  if (!muscle) return <Empty>Muscle not found.</Empty>;
  const group = getRegion(muscle.regionId).groups.find((g) => g.id === muscle.groupId);

  // Keyed by muscle so per-muscle state (selected image, 3D camera) resets when following a link to another muscle.
  return (
    <div className="page" key={muscle.id}>
      <PageHeader back title={muscle.name} subtitle={muscle.latinName} actions={<ShareButton label="Share muscle" onShare={() => shareMuscle(muscle)} />} />
      <p className="breadcrumb">
        {getRegion(muscle.regionId).name} › {group?.name}
        {muscle.layer ? ` › ${muscle.layer}` : ''}
      </p>
      <TabStrip active={tab} onSelect={(id) => setParams({ tab: id }, { replace: true })} />
      {tab === 'overview' && <OverviewTab muscle={muscle} />}
      {tab === 'attachments' && <AttachmentsTab muscle={muscle} />}
      {tab === 'supply' && <SupplyTab muscle={muscle} />}
      {tab === 'actions' && <ActionsTab muscle={muscle} />}
      {tab === 'clinical' && <ClinicalTab muscle={muscle} />}
      {tab === 'assessment' && <AssessmentTab muscle={muscle} />}
      {tab === 'exercises' && <ExercisesTab muscle={muscle} />}
      {tab === 'techniques' && <TechniquesTab muscleId={muscle.id} />}
      {tab === '3d' && (
        <Suspense fallback={<p className="muted center">Loading 3D viewer…</p>}>
          <AnatomyViewer muscleId={muscle.id} />
        </Suspense>
      )}
      <Disclaimer />
    </div>
  );
}

/** Horizontally scrolling tabs; keeps the active tab in view (e.g. when opened from a link). */
function TabStrip({ active, onSelect }: { active: TabId; onSelect: (id: TabId) => void }) {
  const activeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }, [active]);
  return (
    <nav className="tabs" aria-label="Sections">
      {TABS.map((t) => (
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

function Gallery({ images }: { images: MuscleImage[] }) {
  const [index, setIndex] = useState(0);
  const current = images[index];
  if (!current) return <Note>No 3D model exists for this muscle in the open anatomy atlases, so there is no image.</Note>;
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

function OverviewTab({ muscle }: { muscle: Muscle }) {
  return (
    <>
      <p className="summary">{muscle.summary}</p>
      <Gallery images={muscleViews(muscle.id)} />
      {muscle.synonyms.length > 0 && (
        <p className="muted">
          <strong>Also called:</strong> {muscle.synonyms.join(', ')}
        </p>
      )}
      <BulletSection title="Anatomy & structure" items={muscle.structure} />
      <BulletSection title="Function" items={muscle.functions} />
      <SourcesSection sourceIds={muscle.sourceIds} />
    </>
  );
}

function AttachmentList({ items }: { items: Attachment[] }) {
  return (
    <ul className="bullets">
      {items.map((item) => (
        <li key={item.text}>
          {item.text}
          {item.bones.length > 0 && (
            <span className="bone-tags">
              {item.bones.map((boneId) => (
                <Link key={boneId} to={`/bones/${boneId}`} className="tag">
                  {getBone(boneId).name}
                </Link>
              ))}
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}

function AttachmentsTab({ muscle }: { muscle: Muscle }) {
  const image = attachmentImage(muscle.id);
  return (
    <>
      <Card title="Origin">
        <AttachmentList items={muscle.origin} />
      </Card>
      <Card title="Insertion">
        <AttachmentList items={muscle.insertion} />
      </Card>
      {image ? <Gallery images={[image]} /> : <Note>The open 3D atlas has no attachment areas for this muscle.</Note>}
      {image && <Note>Attachment areas come from the open Z-Anatomy model and may not show every attachment listed above.</Note>}
      <BulletSection title="Variations" items={muscle.variationNotes} />
    </>
  );
}

function SupplyTab({ muscle }: { muscle: Muscle }) {
  return (
    <>
      <Card title="Innervation">
        <ul className="bullets">
          {muscle.innervation.map((supply) => (
            <li key={supply.nerveId}>
              <NerveSupplyLine supply={supply} />
            </li>
          ))}
        </ul>
        {muscle.innervationNote && <Note>{muscle.innervationNote}</Note>}
        {muscle.reflex && (
          <p>
            <strong>Reflex:</strong> {muscle.reflex.name} ({formatRoots(muscle.reflex.roots)})
          </p>
        )}
      </Card>
      <BulletSection title="Blood supply" items={muscle.bloodSupply} />
    </>
  );
}

function RelatedList({ label, related }: { label: string; related: RelatedMuscle[] }) {
  return (
    <div className="related">
      <span className="related-label">{label}</span>
      {related.length === 0 ? (
        <span className="muted">None in the current data</span>
      ) : (
        <span className="chips">
          {related.map(({ muscle, action }) => (
            <span key={muscle.id} className={action.role === 'assist' ? 'chip-assist' : ''}>
              <MuscleLink id={muscle.id} />
            </span>
          ))}
        </span>
      )}
    </div>
  );
}

function ActionCard({ muscle, action }: { muscle: Muscle; action: MuscleAction }) {
  const joint = getJoint(action.jointId);
  const movement = required(joint.movements.find((m) => m.name === action.movement), `${joint.id} has no movement ${action.movement}`);
  const range = movement.rangeDegrees;
  const hasOpposite = movement.opposite !== undefined;
  return (
    <li className="action-card">
      <div className="action-title">
        <span className={`role role-${action.role}`}>{action.role === 'prime' ? 'Prime mover' : 'Assists'}</span>
        <strong>
          <Link to={`/joints/${joint.id}`}>{joint.name}</Link>: {action.movement}
        </strong>
        {range !== undefined && <span className="muted"> · normal ROM {range}°</span>}
      </div>
      {action.note && <p className="muted">{action.note}</p>}
      <RelatedList label="Agonists" related={agonists(muscle, action)} />
      {hasOpposite && <RelatedList label="Antagonists" related={antagonists(muscle, action)} />}
    </li>
  );
}

function ActionsTab({ muscle }: { muscle: Muscle }) {
  if (muscle.actions.length === 0) return <Note>This muscle does not move a joint; see Function in the Overview tab.</Note>;
  return (
    <>
      <ul className="action-list">
        {muscle.actions.map((action) => (
          <ActionCard key={`${action.jointId}|${action.movement}`} muscle={muscle} action={action} />
        ))}
      </ul>
      <Note>
        Agonists and antagonists are worked out from the actions of every muscle in the app, so they always agree with each muscle’s own action list. Outlined names assist; filled names are prime movers.
      </Note>
    </>
  );
}

function ClinicalTab({ muscle }: { muscle: Muscle }) {
  return (
    <>
      <BulletSection title="Clinical significance" items={muscle.clinical} />
      {muscle.triggerPoints.length > 0 && (
        <Card title="Trigger points & referred pain">
          <ul className="bullets">
            {muscle.triggerPoints.map((tp) => (
              <li key={tp.location}>
                <strong>{tp.location}:</strong> {tp.referral}
              </li>
            ))}
          </ul>
        </Card>
      )}
    </>
  );
}

function Labelled({ label, children }: { label: string; children: ReactNode }) {
  return (
    <p>
      <strong>{label}:</strong> {children}
    </p>
  );
}

function AssessmentTab({ muscle }: { muscle: Muscle }) {
  return (
    <>
      <BulletSection title="Palpation" items={muscle.palpation} />
      <Card title="Manual muscle test">
        <Labelled label="Position">{muscle.muscleTest.position}</Labelled>
        <Labelled label="Stabilise">{muscle.muscleTest.stabilize}</Labelled>
        <Labelled label="Resistance">{muscle.muscleTest.resistance}</Labelled>
      </Card>
      {muscle.specialTestIds.length > 0 && (
        <Card title="Special tests">
          <ul className="link-list">
            {muscle.specialTestIds.map((testId) => {
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
      <BulletSection title="Stretching" items={muscle.stretch} />
      <BulletSection title="Strengthening" items={muscle.strengthening} />
    </>
  );
}

function ExercisesTab({ muscle }: { muscle: Muscle }) {
  const { primary, secondary } = exercisesForMuscle(muscle.id);
  if (primary.length === 0 && secondary.length === 0) return <Empty>No exercise in the Rehab database targets this muscle.</Empty>;
  return (
    <>
      {primary.length > 0 && (
        <section className="card list-card">
          <h2 className="list-card-title">Main target ({primary.length})</h2>
          <ExerciseList exercises={primary} />
        </section>
      )}
      {secondary.length > 0 && (
        <section className="card list-card">
          <h2 className="list-card-title">Also works it ({secondary.length})</h2>
          <ExerciseList exercises={secondary} />
        </section>
      )}
    </>
  );
}

function TechniquesTab({ muscleId }: { muscleId: string }) {
  const views = linkedTechniques(useTechniqueViews(), { kind: 'muscle', id: muscleId });
  if (views.length === 0) return <Empty>No technique in the directory targets this muscle yet. You can add your own in Techniques.</Empty>;
  return <TechniquesCard views={views} />;
}
