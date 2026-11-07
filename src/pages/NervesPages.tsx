import { LinkedTechniquesCard } from '../components/techniques';
import { Link, useParams } from 'react-router';
import { LibraryTabs } from '../components/LibraryTabs';
import { ImageRow, ResultCard, RowGroup, StructureFigure } from '../components/ImageRows';
import { BulletSection, Card, Disclaimer, Empty, EmptyState, MuscleLink, PageHeader } from '../components/ui';
import { useUrlParams } from '../components/useUrlParams';
import { findNerve, getNerve, MUSCLES, NERVE_GROUPS, NERVES } from '../data';
import { exercisesForNerve } from '../data/exercises';
import { nerveImage, nerveThumbnail } from '../data/images';
import type { Nerve, SpinalRoot } from '../data/types';
import { matchesWords } from '../domain/search';
import { branchesOf, formatRoots, musclesSuppliedBy, musclesSuppliedViaBranches, musclesWithRoot, usedRoots } from '../domain/relations';

/** Upper-limb myotomes: the usual screening movement and the ASIA (ISNCSCI) key muscle group. */
const KEY_MYOTOMES: { root: SpinalRoot; screening: string; asia: string }[] = [
  { root: 'C5', screening: 'Shoulder abduction', asia: 'Elbow flexors' },
  { root: 'C6', screening: 'Elbow flexion, wrist extension', asia: 'Wrist extensors' },
  { root: 'C7', screening: 'Elbow extension, wrist flexion', asia: 'Elbow extensors' },
  { root: 'C8', screening: 'Thumb extension, finger flexion', asia: 'Finger flexors (middle finger DIP)' },
  { root: 'T1', screening: 'Finger abduction', asia: 'Little finger abductor' },
];

/** Nerves as image rows grouped by body area, like the muscle list, with myotome and root look-ups below. */
export function NervesPage() {
  const [values, update] = useUrlParams({ text: 'q' });
  const text = values.text ?? '';
  const searching = text.trim() !== '';
  const results = NERVES.filter((nerve) => matchesWords(text, [nerve.name, ...nerve.roots]));
  return (
    <div className="page">
      <PageHeader title="Nerves" subtitle={`${NERVES.length} peripheral nerves and the muscles they supply`} />
      <LibraryTabs />
      <input type="search" className="search-input" placeholder="Search nerves or roots, e.g. median, C5" value={text} onChange={(event) => update({ text: event.target.value })} aria-label="Search nerves" />
      {searching ? (
        results.length === 0 ? (
          <EmptyState icon="search">Nothing matches “{text}”.</EmptyState>
        ) : (
          <ResultCard title={`Nerves (${results.length})`}>
            {results.map((nerve) => (
              <NerveRow key={nerve.id} nerve={nerve} />
            ))}
          </ResultCard>
        )
      ) : (
        NERVE_GROUPS.map((group) => (
          <RowGroup key={group.name} name={group.name} count={group.nerveIds.length}>
            {group.nerveIds.map((id) => (
              <NerveRow key={id} nerve={getNerve(id)} />
            ))}
          </RowGroup>
        ))
      )}
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
              <Link to={`/muscles?root=${encodeURIComponent(root)}`}>{root}</Link>
              <span className="muted"> — {musclesWithRoot(root).length} of {MUSCLES.length} muscles</span>
            </li>
          ))}
        </ul>
      </Card>
      <Disclaimer />
    </div>
  );
}

function NerveRow({ nerve }: { nerve: Nerve }) {
  const count = musclesSuppliedBy(nerve.id).length;
  return <ImageRow to={`/nerves/${nerve.id}`} thumb={nerveThumbnail(nerve.id)} name={nerve.name} meta={`${formatRoots(nerve.roots)} · ${count} ${count === 1 ? 'muscle' : 'muscles'}`} />;
}

export function NerveDetailPage() {
  const { id = '' } = useParams();
  const nerve = findNerve(id);
  if (!nerve) return <Empty>Nerve not found.</Empty>;
  const muscles = musclesSuppliedBy(nerve.id);
  const viaBranches = musclesSuppliedViaBranches(nerve.id);
  const branches = branchesOf(nerve.id);
  const sliders = exercisesForNerve(nerve.id);
  return (
    <div className="page">
      <PageHeader back title={nerve.name} subtitle={`Roots ${formatRoots(nerve.roots)}`} />
      <StructureFigure image={nerveImage(nerve.id)} alt={`${nerve.name} on the skeleton`} />
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
      {sliders.length > 0 && (
        <Card title="Nerve mobility exercises">
          <ul className="link-list">
            {sliders.map((exercise) => (
              <li key={exercise.id}>
                <Link to={`/rehab/exercises/${exercise.id}`}>{exercise.name}</Link>
              </li>
            ))}
          </ul>
        </Card>
      )}
      <LinkedTechniquesCard link={{ kind: 'nerve', id: nerve.id }} />
      <Disclaimer />
    </div>
  );
}
