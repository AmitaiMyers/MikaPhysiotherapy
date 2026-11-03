import { Link, useParams } from 'react-router';
import { BulletSection, Card, Disclaimer, Empty, MuscleLink, PageHeader } from '../components/ui';
import { findNerve, getNerve, MUSCLES, NERVES } from '../data';
import type { SpinalRoot } from '../data/types';
import { branchesOf, formatRoots, musclesSuppliedBy, musclesSuppliedViaBranches, musclesWithRoot, usedRoots } from '../domain/relations';

/** Upper-limb myotomes: the usual screening movement and the ASIA (ISNCSCI) key muscle group. */
const KEY_MYOTOMES: { root: SpinalRoot; screening: string; asia: string }[] = [
  { root: 'C5', screening: 'Shoulder abduction', asia: 'Elbow flexors' },
  { root: 'C6', screening: 'Elbow flexion, wrist extension', asia: 'Wrist extensors' },
  { root: 'C7', screening: 'Elbow extension, wrist flexion', asia: 'Elbow extensors' },
  { root: 'C8', screening: 'Thumb extension, finger flexion', asia: 'Finger flexors (middle finger DIP)' },
  { root: 'T1', screening: 'Finger abduction', asia: 'Little finger abductor' },
];

export function NervesPage() {
  return (
    <div className="page">
      <PageHeader title="Nerves" subtitle="Peripheral nerves and the muscles they supply" />
      <Card title="Peripheral nerves">
        <ul className="link-list">
          {NERVES.map((nerve) => (
            <li key={nerve.id}>
              <Link to={`/nerves/${nerve.id}`}>{nerve.name}</Link>
              <span className="muted">
                {' '}
                — {formatRoots(nerve.roots)} · {musclesSuppliedBy(nerve.id).length} muscles
              </span>
            </li>
          ))}
        </ul>
      </Card>
      <Card title="Key myotomes">
        <ul className="link-list">
          {KEY_MYOTOMES.map(({ root, screening, asia }) => (
            <li key={root}>
              <strong>{root}</strong> {screening} <span className="muted">· ASIA key muscle: {asia}</span>
            </li>
          ))}
        </ul>
      </Card>
      <Card title="Muscles by root">
        <ul className="link-list">
          {usedRoots().map((root) => (
            <li key={root}>
              <Link to={`/?root=${encodeURIComponent(root)}`}>{root}</Link>
              <span className="muted"> — {musclesWithRoot(root).length} of {MUSCLES.length} muscles</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

export function NerveDetailPage() {
  const { id = '' } = useParams();
  const nerve = findNerve(id);
  if (!nerve) return <Empty>Nerve not found.</Empty>;
  const muscles = musclesSuppliedBy(nerve.id);
  const viaBranches = musclesSuppliedViaBranches(nerve.id);
  const branches = branchesOf(nerve.id);
  return (
    <div className="page">
      <PageHeader back title={nerve.name} subtitle={`Roots ${formatRoots(nerve.roots)}`} />
      <Card title="Origin & course">
        <p>{nerve.origin}</p>
        {nerve.parentId && (
          <p>
            Branch of the <Link to={`/nerves/${nerve.parentId}`}>{getNerve(nerve.parentId).name}</Link>.
          </p>
        )}
      </Card>
      <Card title={`Muscles supplied directly (${muscles.length})`}>
        {muscles.length === 0 ? <p className="muted">None directly; see its branches.</p> : <span className="chips">{muscles.map((m) => <MuscleLink key={m.id} id={m.id} />)}</span>}
      </Card>
      {branches.length > 0 && (
        <Card title={`Via its branches (${viaBranches.length})`}>
          <ul className="link-list">
            {branches.map((branch) => (
              <li key={branch.id}>
                <Link to={`/nerves/${branch.id}`}>{branch.name}</Link>
              </li>
            ))}
          </ul>
          {viaBranches.length > 0 && <span className="chips spaced">{viaBranches.map((m) => <MuscleLink key={m.id} id={m.id} />)}</span>}
        </Card>
      )}
      <Card title="Sensory supply">
        <p>{nerve.sensory}</p>
      </Card>
      <BulletSection title="Lesions & clinical presentation" items={nerve.lesion} />
      <Disclaimer />
    </div>
  );
}
