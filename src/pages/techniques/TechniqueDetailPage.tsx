import { Link, useNavigate, useParams } from 'react-router';
import { ExerciseList } from '../../components/ExerciseList';
import { VideoLinkEditor, VideoPlayer } from '../../components/ExerciseVideo';
import { MuscleImageStrip } from '../../components/MuscleImageStrip';
import { EvidenceBadge, ReferenceChips, ReferencesSection } from '../../components/techniques';
import { BulletSection, Card, Disclaimer, Empty, PageHeader, ShareButton } from '../../components/ui';
import { getJoint, getMuscle, getNerve } from '../../data';
import { getExercise } from '../../data/exercises';
import type { VideoRef } from '../../data/exerciseTypes';
import { areaNames, getCondition, getFamily } from '../../data/techniques';
import { TECHNIQUE_VIDEOS } from '../../data/techniques/videos';
import { appUrl, shareContent } from '../../domain/share';
import { useVideoChoice } from '../../domain/videoOverrides';
import { searchUrl, watchUrl } from '../../domain/videos';
import { familyName, resolveTechnique } from '../../techniques/catalog';
import { deleteCustomTechnique, useTechniqueContent } from '../../techniques/store';
import { referenceIdsOf, viewOf, type TechniqueView } from '../../techniques/view';
import { MediaGallery } from './Media';
import { NotesSection, originLabel } from './Notes';
import { AddToPatientButton, ShareTechniqueCard } from './ShareAndAssign';

export function TechniqueDetailPage() {
  const { id = '' } = useParams();
  const content = useTechniqueContent();
  const resolved = resolveTechnique(id, content.techniques);
  if (resolved === undefined) return content.ready ? <Empty>Technique not found.</Empty> : <p className="muted center">Loading…</p>;
  // Keyed so per-technique state resets when following a link to another technique.
  return <TechniqueDetail key={id} view={viewOf(resolved)} />;
}

function formatViews(views: number): string {
  return views >= 1_000_000 ? `${(views / 1_000_000).toFixed(1)}M` : views >= 1000 ? `${Math.round(views / 1000)}K` : String(views);
}

/** Plain-text card for messaging apps. */
function techniqueShareText(view: TechniqueView): string {
  return [
    `${view.name} — ${familyName(view.familyId)}`,
    view.summary,
    '',
    `Position: ${view.position}`,
    ...view.steps.map((step, i) => `${i + 1}. ${step}`),
    ...(view.dosage === '' ? [] : [`Dosage: ${view.dosage}`]),
    ...(view.safety.length === 0 ? [] : [`Safety: ${view.safety.join(' ')}`]),
  ].join('\n');
}

function TechniqueDetail({ view }: { view: TechniqueView }) {
  const family = view.familyId === null ? null : getFamily(view.familyId);
  const content = useTechniqueContent();
  const builtinVideo = TECHNIQUE_VIDEOS[view.id];
  const choice = useVideoChoice(
    `technique:${view.id}`,
    builtinVideo === undefined ? null : { video: { id: builtinVideo.id, startSec: 0 }, label: `${builtinVideo.channel} · ${formatViews(builtinVideo.views)} views` },
  );
  const video: VideoRef | null = view.custom === null ? choice.video : view.custom.video;
  const noteMedia = content.notes.filter((n) => n.techniqueId === view.id).flatMap((n) => n.mediaIds);
  const ownMedia = [...(view.custom?.mediaIds ?? []), ...noteMedia];
  const referenceIds = referenceIdsOf(view);

  return (
    <div className="page">
      <PageHeader
        back
        title={view.name}
        subtitle={view.aliases.length > 0 ? view.aliases.join(' · ') : undefined}
        actions={<ShareButton label="Share as text" onShare={() => shareContent({ title: view.name, text: techniqueShareText(view), url: appUrl(`/techniques/${view.id}`) })} />}
      />
      <p className="breadcrumb">
        {family === null ? familyName(null) : <Link to={`/techniques/families/${family.id}`}>{family.name}</Link>} › {areaNames(view.areas)}
      </p>
      {view.custom !== null && <p className="muted small">{originLabel(view.custom.author, view.custom.origin)}</p>}
      {family?.training != null && <p className="note">⚠ {family.training}</p>}
      <VideoPlayer title={view.name} video={video} />
      {view.summary !== '' && (
        <aside className="tip-box">
          <span className="tip-label">What it is for</span>
          <p>{view.summary}</p>
        </aside>
      )}
      <div className="button-row">
        <AddToPatientButton techniqueId={view.id} name={view.name} />
        {view.custom !== null && <CustomActions view={view} />}
      </div>
      <IndicationsCard view={view} />
      {view.position !== '' && (
        <Card title="Position">
          <p>{view.position}</p>
        </Card>
      )}
      <Card title="How to do it">
        <ol className="steps">
          {view.steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </Card>
      <BulletSection title="Key points" items={view.keyPoints} />
      {view.dosage !== '' && (
        <Card title="Dosage">
          <p>{view.dosage}</p>
        </Card>
      )}
      <SafetyCard view={view} />
      <TargetsCard view={view} />
      <ReferenceImagesCard view={view} video={video} ownMedia={ownMedia} />
      {view.exerciseIds.length > 0 && (
        <section className="card list-card">
          <h2>Continue at home</h2>
          <ExerciseList exercises={view.exerciseIds.map(getExercise)} />
        </section>
      )}
      <NotesSection techniqueId={view.id} />
      <ShareTechniqueCard techniqueId={view.id} name={view.name} hasOwnMedia={ownMedia.length > 0} />
      {view.custom === null && <VideoLinkEditor state={choice} searches={[{ label: 'Search YouTube', url: searchUrl(view.name.replace(' — ', ' ')) }]} hint="Search YouTube for a tutorial, then copy the video link and paste it above:" />}
      <ReferencesSection refIds={referenceIds} reviewed={family?.reviewed ?? null} />
      <Disclaimer />
    </div>
  );
}

function IndicationsCard({ view }: { view: TechniqueView }) {
  if (view.indications.length === 0) return null;
  return (
    <Card title="Used for">
      <ul className="indication-list">
        {view.indications.map((indication) => (
          <li key={indication.conditionId}>
            <div className="indication-head">
              <Link to={`/techniques/conditions/${indication.conditionId}`}>{getCondition(indication.conditionId).name}</Link>
              <EvidenceBadge grade={indication.grade} />
            </div>
            <p className="small">{indication.finding}</p>
            <ReferenceChips refIds={indication.refIds} />
          </li>
        ))}
      </ul>
    </Card>
  );
}

function SafetyCard({ view }: { view: TechniqueView }) {
  if (view.safety.length === 0 && view.familyId === null) return null;
  return (
    <section className="card safety-card">
      <h2>Safety</h2>
      {view.safety.length > 0 && (
        <ul className="bullets">
          {view.safety.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      )}
      {view.familyId !== null && (
        <Link to={`/techniques/families/${view.familyId}#safety`} className="small">
          Contraindications and precautions for {getFamily(view.familyId).name.toLowerCase()} ›
        </Link>
      )}
    </section>
  );
}

/** Target muscles with their images and, for needling and pressure techniques, their trigger points. */
function TargetsCard({ view }: { view: TechniqueView }) {
  if (view.muscleIds.length + view.jointIds.length + view.nerveIds.length === 0) return null;
  const showTriggerPoints = view.familyId === 'dry-needling' || view.familyId === 'trigger-point-pressure';
  return (
    <Card title="Targets">
      <MuscleImageStrip muscleIds={view.muscleIds} />
      {showTriggerPoints &&
        view.muscleIds.map((id) => {
          const muscle = getMuscle(id);
          if (muscle.triggerPoints.length === 0) return null;
          return (
            <div key={id} className="trigger-points">
              <h3 className="subheading">Trigger points & referral — {muscle.name}</h3>
              <ul className="bullets small">
                {muscle.triggerPoints.map((tp) => (
                  <li key={tp.location}>
                    <strong>{tp.location}:</strong> {tp.referral}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      {view.jointIds.length > 0 && (
        <>
          <h3 className="subheading">Joints</h3>
          <span className="chips">
            {view.jointIds.map((id) => (
              <Link key={id} className="chip-link" to={`/joints/${id}`}>
                {getJoint(id).name}
              </Link>
            ))}
          </span>
        </>
      )}
      {view.nerveIds.length > 0 && (
        <>
          <h3 className="subheading">Nerves</h3>
          <span className="chips">
            {view.nerveIds.map((id) => (
              <Link key={id} className="chip-link" to={`/nerves/${id}`}>
                {getNerve(id).name}
              </Link>
            ))}
          </span>
        </>
      )}
    </Card>
  );
}

/** A frame of the tutorial video, plus Mika's own photos and videos of the technique. */
function ReferenceImagesCard({ view, video, ownMedia }: { view: TechniqueView; video: VideoRef | null; ownMedia: string[] }) {
  if (video === null && ownMedia.length === 0) return null;
  return (
    <Card title="Reference images">
      {video !== null && (
        <a href={watchUrl(video)} target="_blank" rel="noreferrer" className="video-still">
          <img src={`https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`} alt={`Frame from the ${view.name} video`} loading="lazy" width={480} height={360} />
          <span className="muted small">Frame from the tutorial video — open it to watch the full technique.</span>
        </a>
      )}
      <MediaGallery mediaIds={ownMedia} />
      {ownMedia.length === 0 && <p className="muted small">Add your own photos or videos of the technique in “My notes & variations”.</p>}
    </Card>
  );
}

function CustomActions({ view }: { view: TechniqueView }) {
  const navigate = useNavigate();
  const custom = view.custom;
  if (custom === null) return null;
  return (
    <>
      <Link to={`/techniques/${custom.id}/edit`} className="button">
        Edit
      </Link>
      <button
        type="button"
        className="text-button danger"
        onClick={() => {
          if (!window.confirm(`Delete “${custom.name}” with its notes, photos and videos?`)) return;
          deleteCustomTechnique(custom);
          void navigate('/techniques', { replace: true });
        }}
      >
        Delete
      </button>
    </>
  );
}
