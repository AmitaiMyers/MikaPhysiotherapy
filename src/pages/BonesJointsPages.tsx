import { LinkedTechniquesCard } from '../components/techniques';
import { Link, useParams } from 'react-router';
import { LibraryTabs } from '../components/LibraryTabs';
import type { ReactNode } from 'react';
import { Icon } from '../components/Icon';
import { Card, Disclaimer, Empty, EmptyState, MuscleLink, Note, PageHeader } from '../components/ui';
import { useUrlParams } from '../components/useUrlParams';
import { skeletonImage, skeletonThumbnail, type SkeletonKind } from '../data/images';
import { matchesWords } from '../domain/search';
import { BONES, findBone, findJoint, JOINT_GROUPS, JOINTS } from '../data';
import type { Bone, BoneRegion, Joint } from '../data/types';
import { attachmentsOnBone, musclesPerforming } from '../domain/relations';

const BONE_REGION_NAMES: Record<BoneRegion, string> = {
  skull: 'Skull',
  neck: 'Neck (hyoid and larynx)',
  'vertebral-column': 'Vertebral column',
  thorax: 'Thorax',
  pelvis: 'Pelvis',
  'shoulder-girdle': 'Shoulder girdle',
  arm: 'Arm',
  forearm: 'Forearm',
  hand: 'Wrist & hand',
  thigh: 'Thigh & knee',
  leg: 'Leg',
  foot: 'Ankle & foot',
};

const BONE_REGION_ORDER = Object.keys(BONE_REGION_NAMES) as BoneRegion[];

/** Bones and joints as image rows, grouped like the muscle list, with one search across both. */
export function BonesJointsPage() {
  const [values, update] = useUrlParams({ text: 'q' });
  const text = values.text ?? '';
  const searching = text.trim() !== '';
  const joints = JOINTS.filter((joint) => matchesWords(text, [joint.name, joint.type]));
  const bones = BONES.filter((bone) => matchesWords(text, [bone.name]));

  return (
    <div className="page">
      <PageHeader title="Bones & joints" subtitle={`${BONES.length} bones · ${JOINTS.length} joints`} />
      <LibraryTabs />
      <input type="search" className="search-input" placeholder="Search bones and joints" value={text} onChange={(event) => update({ text: event.target.value })} aria-label="Search bones and joints" />
      {searching && joints.length + bones.length === 0 && <EmptyState icon="search">Nothing matches “{text}”.</EmptyState>}
      {searching ? (
        <>
          {joints.length > 0 && <ResultCard title={`Joints (${joints.length})`}>{joints.map((joint) => <JointRow key={joint.id} joint={joint} />)}</ResultCard>}
          {bones.length > 0 && <ResultCard title={`Bones (${bones.length})`}>{bones.map((bone) => <BoneRow key={bone.id} bone={bone} />)}</ResultCard>}
        </>
      ) : (
        <>
          <details className="region" open>
            <summary className="region-summary">
              <span>Joints</span>
              <span className="count">{JOINTS.length}</span>
            </summary>
            {JOINT_GROUPS.map((group) => (
              <details key={group.name} className="card group">
                <summary className="group-summary">
                  <span className="group-name">{group.name}</span>
                  <span className="count">{group.jointIds.length}</span>
                </summary>
                <ul className="muscle-list">
                  {group.jointIds.map((id) => {
                    const joint = findJoint(id);
                    return joint === undefined ? null : <JointRow key={id} joint={joint} />;
                  })}
                </ul>
              </details>
            ))}
          </details>
          <details className="region" open>
            <summary className="region-summary">
              <span>Bones</span>
              <span className="count">{BONES.length}</span>
            </summary>
            {BONE_REGION_ORDER.map((region) => {
              const inRegion = BONES.filter((bone) => bone.region === region);
              if (inRegion.length === 0) return null;
              return (
                <details key={region} className="card group">
                  <summary className="group-summary">
                    <span className="group-name">{BONE_REGION_NAMES[region]}</span>
                    <span className="count">{inRegion.length}</span>
                  </summary>
                  <ul className="muscle-list">
                    {inRegion.map((bone) => (
                      <BoneRow key={bone.id} bone={bone} />
                    ))}
                  </ul>
                </details>
              );
            })}
          </details>
        </>
      )}
      <Disclaimer />
    </div>
  );
}

function ResultCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="card list-card">
      <h2>{title}</h2>
      <ul className="muscle-list">{children}</ul>
    </section>
  );
}

/** A list row with the structure's thumbnail, like a muscle row. */
function ImageRow({ to, thumb, name, meta }: { to: string; thumb: string | null; name: string; meta: string }) {
  return (
    <li>
      <Link to={to} className="muscle-row">
        {thumb !== null ? <img src={thumb} alt="" className="thumb" loading="lazy" width={56} height={56} /> : <span className="thumb thumb-empty" aria-hidden="true" />}
        <span className="muscle-row-text">
          <span className="muscle-row-name">{name}</span>
          <span className="muscle-row-meta">{meta}</span>
        </span>
        <span className="chevron" aria-hidden="true">
          <Icon name="chevron" size={18} />
        </span>
      </Link>
    </li>
  );
}

function JointRow({ joint }: { joint: Joint }) {
  return <ImageRow to={`/joints/${joint.id}`} thumb={skeletonThumbnail('joints', joint.id)} name={joint.name} meta={`${joint.type} · ${joint.movements.length} ${joint.movements.length === 1 ? 'movement' : 'movements'}`} />;
}

function BoneRow({ bone }: { bone: Bone }) {
  const { origins, insertions } = attachmentsOnBone(bone.id);
  const attachments = origins.length + insertions.length;
  return <ImageRow to={`/bones/${bone.id}`} thumb={skeletonThumbnail('bones', bone.id)} name={bone.name} meta={`${BONE_REGION_NAMES[bone.region]} · ${attachments} muscle ${attachments === 1 ? 'attachment' : 'attachments'}`} />;
}

/** The structure's picture at the top of its page, like a muscle's. */
function SkeletonFigure({ kind, id, name }: { kind: SkeletonKind; id: string; name: string }) {
  const image = skeletonImage(kind, id);
  if (image === null) return null;
  return (
    <figure className="gallery">
      <div className="image-frame">
        <img src={image.url} alt={`${name} highlighted on the skeleton, ${image.caption.toLowerCase()}`} width={800} height={1000} />
      </div>
      <figcaption>{image.caption}</figcaption>
    </figure>
  );
}

export function BoneDetailPage() {
  const { id = '' } = useParams();
  const bone = findBone(id);
  if (!bone) return <Empty>Bone not found.</Empty>;
  const { origins, insertions } = attachmentsOnBone(bone.id);
  const joints = JOINTS.filter((joint) => joint.bones.includes(bone.id));
  return (
    <div className="page">
      <PageHeader back title={bone.name} subtitle={BONE_REGION_NAMES[bone.region]} />
      <SkeletonFigure kind="bones" id={bone.id} name={bone.name} />
      <Card title={`Origins (${origins.length})`}>
        {origins.length === 0 ? <p className="muted">None in the current data.</p> : <span className="chips">{origins.map((m) => <MuscleLink key={m.id} id={m.id} />)}</span>}
      </Card>
      <Card title={`Insertions (${insertions.length})`}>
        {insertions.length === 0 ? <p className="muted">None in the current data.</p> : <span className="chips">{insertions.map((m) => <MuscleLink key={m.id} id={m.id} />)}</span>}
      </Card>
      {joints.length > 0 && (
        <Card title="Joints">
          <ul className="link-list">
            {joints.map((joint) => (
              <li key={joint.id}>
                <Link to={`/joints/${joint.id}`}>{joint.name}</Link>
              </li>
            ))}
          </ul>
        </Card>
      )}
      <LinkedTechniquesCard link={{ kind: 'bone', id: bone.id }} title="Techniques for its joints" />
      <Link to={`/muscles?bone=${bone.id}`} className="button">
        Show these muscles in the list
      </Link>
      <Disclaimer />
    </div>
  );
}

export function JointDetailPage() {
  const { id = '' } = useParams();
  const joint = findJoint(id);
  if (!joint) return <Empty>Joint not found.</Empty>;
  return (
    <div className="page">
      <PageHeader back title={joint.name} subtitle={joint.type} />
      <SkeletonFigure kind="joints" id={joint.id} name={joint.name} />
      {joint.movements.map((movement) => {
        const movers = musclesPerforming(joint.id, movement.name);
        return (
          <Card key={movement.name} title={movement.name[0]?.toUpperCase() + movement.name.slice(1)}>
            {movement.rangeDegrees !== undefined && <p className="muted">Normal active range: 0–{movement.rangeDegrees}° (AAOS)</p>}
            {movers.length === 0 ? (
              <p className="muted">No muscle in the current data.</p>
            ) : (
              <ul className="mover-list">
                {movers.map(({ muscle, action }) => (
                  <li key={muscle.id}>
                    <span className={`role role-${action.role}`}>{action.role === 'prime' ? 'Prime' : 'Assist'}</span>
                    <MuscleLink id={muscle.id} />
                    {action.note && <span className="muted small"> {action.note}</span>}
                  </li>
                ))}
              </ul>
            )}
          </Card>
        );
      })}
      <Note>Movers are worked out from the action lists of all muscles in the app.</Note>
      <LinkedTechniquesCard link={{ kind: 'joint', id: joint.id }} />
      <Disclaimer />
    </div>
  );
}
