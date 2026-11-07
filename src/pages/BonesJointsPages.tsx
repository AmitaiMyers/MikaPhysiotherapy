import { LinkedTechniquesCard } from '../components/techniques';
import { Link, useParams } from 'react-router';
import { LibraryTabs } from '../components/LibraryTabs';
import { Card, Disclaimer, Empty, MuscleLink, Note, PageHeader } from '../components/ui';
import { BONES, findBone, findJoint, JOINTS } from '../data';
import type { BoneRegion } from '../data/types';
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

export function BonesJointsPage() {
  return (
    <div className="page">
      <PageHeader title="Bones & joints" subtitle="Attachments and the muscles that move each joint" />
      <LibraryTabs />
      <Card title="Joints">
        <ul className="link-list">
          {JOINTS.map((joint) => (
            <li key={joint.id}>
              <Link to={`/joints/${joint.id}`}>{joint.name}</Link>
              <span className="muted"> — {joint.type}</span>
            </li>
          ))}
        </ul>
      </Card>
      {(Object.keys(BONE_REGION_NAMES) as BoneRegion[]).map((region) => (
        <Card key={region} title={BONE_REGION_NAMES[region]}>
          <ul className="link-list">
            {BONES.filter((bone) => bone.region === region).map((bone) => {
              const { origins, insertions } = attachmentsOnBone(bone.id);
              return (
                <li key={bone.id}>
                  <Link to={`/bones/${bone.id}`}>{bone.name}</Link>
                  <span className="muted"> — {origins.length + insertions.length} attachments</span>
                </li>
              );
            })}
          </ul>
        </Card>
      ))}
    </div>
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
