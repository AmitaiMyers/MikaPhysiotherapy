import { Link } from 'react-router';
import { RehabTabs } from '../../components/RehabTabs';
import { EvidenceBadge, TechniqueRows, useTechniqueViews } from '../../components/techniques';
import { Disclaimer, Empty, PageHeader } from '../../components/ui';
import { useUrlParams } from '../../components/useUrlParams';
import { findBone, findJoint, findMuscle, findNerve, REGIONS } from '../../data';
import { CONDITIONS, GRADE_ORDER, TECHNIQUE_AREAS, TECHNIQUE_FAMILIES, TECHNIQUES } from '../../data/techniques';
import { linkedTechniques, searchTechniques, type AnatomyLink, type TechniqueView } from '../../techniques/view';
import { Segmented } from '../../components/Segmented';
import { Icon } from '../../components/Icon';

type DirectoryView = 'region' | 'family' | 'condition';
const VIEW_LABELS: Record<DirectoryView, string> = { region: 'Body region', family: 'Technique', condition: 'Condition' };
const LINK_KINDS = ['muscle', 'joint', 'nerve', 'bone'] as const;

/** The anatomy filter from the URL (e.g. opened from a muscle page), with its display name. */
function anatomyFilter(values: Record<(typeof LINK_KINDS)[number], string | null>): { link: AnatomyLink; name: string } | null {
  for (const kind of LINK_KINDS) {
    const id = values[kind];
    if (id === null) continue;
    const name = { muscle: findMuscle, joint: findJoint, nerve: findNerve, bone: findBone }[kind](id)?.name;
    if (name !== undefined) return { link: { kind, id }, name };
  }
  return null;
}

/** The techniques directory: by body region (default), by technique family, or by condition. */
export function TechniquesPage() {
  const [params, update, clear] = useUrlParams({ text: 'q', view: 'view', muscle: 'muscle', joint: 'joint', nerve: 'nerve', bone: 'bone' });
  const views = useTechniqueViews();
  const view: DirectoryView = params.view === 'family' || params.view === 'condition' ? params.view : 'region';
  const text = params.text ?? '';
  const filter = anatomyFilter(params);
  const scoped = filter === null ? views : linkedTechniques(views, filter.link);
  const results = text.trim() === '' ? scoped : searchTechniques(scoped, text);
  const customs = views.filter((v) => v.custom !== null);

  return (
    <div className="page">
      <PageHeader
        title="Techniques"
        subtitle={`${TECHNIQUES.length} techniques · ${TECHNIQUE_FAMILIES.length} families · evidence-graded`}
        actions={
          <>
            <Link to="/techniques/import" className="icon-button" aria-label="Import techniques from a file">
              <Icon name="download" size={20} />
            </Link>
            <Link to="/techniques/new" className="button button-primary">
              <Icon name="plus" size={18} /> New
            </Link>
          </>
        }
      />
      <RehabTabs />
      <input type="search" className="search-input" placeholder="Search techniques, muscles, conditions" value={text} onChange={(event) => update({ text: event.target.value })} aria-label="Search techniques" />
      {filter !== null && (
        <p className="filter-chip-row">
          <span className="tag">For: {filter.name}</span>
          <button type="button" className="text-button small" onClick={clear}>
            Show all
          </button>
        </p>
      )}
      {text.trim() !== '' || filter !== null ? (
        <section className="card list-card">
          <h2>
            {results.length} {results.length === 1 ? 'technique' : 'techniques'}
          </h2>
          {results.length === 0 ? <Empty>No technique matches.</Empty> : <TechniqueRows views={results} />}
        </section>
      ) : (
        <>
          <Segmented label="Group by" value={view} onChange={(v) => update({ view: v === 'region' ? null : v })} options={(Object.keys(VIEW_LABELS) as DirectoryView[]).map((v) => ({ value: v, label: VIEW_LABELS[v] }))} />
          {customs.length > 0 && (
            <details className="card group" open>
              <summary className="group-summary">
                <span className="group-name">My techniques</span>
                <span className="count">{customs.length}</span>
              </summary>
              <TechniqueRows views={customs} />
            </details>
          )}
          {view === 'region' && <ByRegion views={views} />}
          {view === 'family' && <ByFamily views={views} />}
          {view === 'condition' && <ByCondition views={views} />}
        </>
      )}
      <Disclaimer />
    </div>
  );
}

function ByRegion({ views }: { views: TechniqueView[] }) {
  return (
    <>
      {REGIONS.map((region) => (
        <details key={region.id} className="region" open>
          <summary className="region-summary">
            <span>{region.name}</span>
            <span className="count">{views.filter((v) => v.areas.some((a) => TECHNIQUE_AREAS.find((area) => area.id === a)?.regionId === region.id)).length}</span>
          </summary>
          {TECHNIQUE_AREAS.filter((area) => area.regionId === region.id).map((area) => {
            const inArea = views.filter((v) => v.areas.includes(area.id));
            return (
              <details key={area.id} className="card group">
                <summary className="group-summary">
                  <span className="group-name">{area.name}</span>
                  <span className="count">{inArea.length}</span>
                </summary>
                <TechniqueRows views={inArea} />
              </details>
            );
          })}
        </details>
      ))}
    </>
  );
}

function ByFamily({ views }: { views: TechniqueView[] }) {
  return (
    <>
      {TECHNIQUE_FAMILIES.map((family) => {
        const inFamily = views.filter((v) => v.familyId === family.id);
        return (
          <details key={family.id} className="card group">
            <summary className="group-summary">
              <span className="group-name">{family.name}</span>
              <span className="count">{inFamily.length}</span>
            </summary>
            <p className="group-description">{family.summary}</p>
            <Link to={`/techniques/families/${family.id}`} className="text-button small">
              About {family.name.toLowerCase()} — mechanism, evidence & safety <Icon name="chevron" size={16} />
            </Link>
            <TechniqueRows views={inFamily} />
          </details>
        );
      })}
    </>
  );
}

function ByCondition({ views }: { views: TechniqueView[] }) {
  return (
    <section className="card list-card">
      <ul className="link-list condition-list">
        {CONDITIONS.map((condition) => {
          const forCondition = linkedTechniques(views, { kind: 'condition', id: condition.id });
          const best = GRADE_ORDER.find((grade) => forCondition.some((v) => v.indications.some((i) => i.conditionId === condition.id && i.grade === grade)));
          return (
            <li key={condition.id}>
              <Link to={`/techniques/conditions/${condition.id}`}>{condition.name}</Link>{' '}
              <span className="muted small">
                {forCondition.length} {forCondition.length === 1 ? 'technique' : 'techniques'}
              </span>{' '}
              {best !== undefined && best !== 'expert' && <EvidenceBadge grade={best} />}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
