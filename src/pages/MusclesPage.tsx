import { useState } from 'react';
import { LibraryTabs } from '../components/LibraryTabs';
import { Icon } from '../components/Icon';
import { Link } from 'react-router';
import { Empty, PageHeader } from '../components/ui';
import { useUrlParams } from '../components/useUrlParams';
import { BONES, getJoint, JOINTS, MUSCLES, NERVES, REGIONS } from '../data';
import { thumbnailUrl } from '../data/images';
import type { Muscle, SpinalRoot } from '../data/types';
import { formatRoots, rootsOf, usedRoots } from '../domain/relations';
import { actionKey, filterMuscles, hasActiveFilters, type MuscleFilters } from '../domain/search';

/** Filters live in the URL so a filtered list can be shared and survives going back. */
function useFilters(): [MuscleFilters, (patch: Partial<MuscleFilters>) => void, () => void] {
  const [values, update, clear] = useUrlParams({ text: 'q', nerveId: 'nerve', root: 'root', action: 'action', boneId: 'bone' });
  const filters: MuscleFilters = { ...values, text: values.text ?? '', root: values.root as SpinalRoot | null };
  return [filters, update, clear];
}

const ACTION_OPTIONS = JOINTS.flatMap((joint) =>
  joint.movements
    .filter((movement) => MUSCLES.some((m) => m.actions.some((a) => a.jointId === joint.id && a.movement === movement.name)))
    .map((movement) => ({ key: actionKey(joint.id, movement.name), label: `${joint.name}: ${movement.name}` })),
);
const USED_NERVES = NERVES.filter((nerve) => MUSCLES.some((m) => m.innervation.some((s) => s.nerveId === nerve.id)));
const USED_BONES = BONES.filter((bone) => MUSCLES.some((m) => [...m.origin, ...m.insertion].some((a) => a.bones.includes(bone.id))));

export function MusclesPage() {
  const [filters, update, clear] = useFilters();
  const [showFilters, setShowFilters] = useState(hasActiveFilters({ ...filters, text: '' }));
  const active = hasActiveFilters(filters);
  const results = filterMuscles(MUSCLES, filters);

  return (
    <div className="page">
      <PageHeader
        title="Muscles"
        subtitle={`${MUSCLES.length} muscles · grouped by region`}
        actions={
          <Link to="/about" className="icon-button" aria-label="About and sources">
            <Icon name="info" />
          </Link>
        }
      />
      <LibraryTabs />
      <div className="search-row">
        <input
          type="search"
          className="search-input"
          placeholder="Search name, Latin name or synonym"
          value={filters.text}
          onChange={(event) => update({ text: event.target.value })}
          aria-label="Search muscles"
        />
        <button type="button" className={`button ${showFilters ? 'button-active' : ''}`} onClick={() => setShowFilters((v) => !v)} aria-expanded={showFilters}>
          Filters
        </button>
      </div>
      {showFilters && <FilterPanel filters={filters} update={update} />}
      {active ? (
        <section className="card list-card">
          <div className="results-header">
            <h2>
              {results.length} {results.length === 1 ? 'muscle' : 'muscles'}
            </h2>
            <button type="button" className="text-button" onClick={clear}>
              Clear
            </button>
          </div>
          {results.length === 0 ? <Empty>No muscle matches these filters.</Empty> : <MuscleList muscles={results} showGroup />}
        </section>
      ) : (
        <GroupedList />
      )}
    </div>
  );
}

function FilterPanel({ filters, update }: { filters: MuscleFilters; update: (patch: Partial<MuscleFilters>) => void }) {
  return (
    <section className="card filter-panel" aria-label="Filters">
      <label className="field">
        <span>Nerve</span>
        <select value={filters.nerveId ?? ''} onChange={(e) => update({ nerveId: e.target.value || null })}>
          <option value="">Any nerve</option>
          {USED_NERVES.map((nerve) => (
            <option key={nerve.id} value={nerve.id}>
              {nerve.name}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        <span>Spinal root</span>
        <select value={filters.root ?? ''} onChange={(e) => update({ root: (e.target.value || null) as SpinalRoot | null })}>
          <option value="">Any root</option>
          {usedRoots().map((root) => (
            <option key={root} value={root}>
              {root}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        <span>Action</span>
        <select value={filters.action ?? ''} onChange={(e) => update({ action: e.target.value || null })}>
          <option value="">Any action</option>
          {ACTION_OPTIONS.map((option) => (
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
    </section>
  );
}

function GroupedList() {
  return (
    <>
      {REGIONS.map((region) => {
        const regionMuscles = MUSCLES.filter((m) => m.regionId === region.id);
        return (
          <details key={region.id} className="region" open={regionMuscles.length > 0}>
            <summary className="region-summary">
              <span>{region.name}</span>
              <span className="count">{regionMuscles.length > 0 ? regionMuscles.length : 'Coming soon'}</span>
            </summary>
            {regionMuscles.length === 0 ? (
              <Empty>This region will be added in a later phase.</Empty>
            ) : (
              region.groups.map((group) => {
                const muscles = regionMuscles.filter((m) => m.groupId === group.id);
                return (
                  <details key={group.id} className="card group">
                    <summary className="group-summary">
                      <span className="group-name">{group.name}</span>
                      <span className="count">{muscles.length}</span>
                    </summary>
                    <p className="group-description">{group.description}</p>
                    <MuscleList muscles={muscles} />
                  </details>
                );
              })
            )}
          </details>
        );
      })}
    </>
  );
}

function MuscleList({ muscles, showGroup = false }: { muscles: Muscle[]; showGroup?: boolean }) {
  return (
    <ul className="muscle-list">
      {muscles.map((muscle) => (
        <li key={muscle.id}>
          <MuscleRow muscle={muscle} showGroup={showGroup} />
        </li>
      ))}
    </ul>
  );
}

function MuscleRow({ muscle, showGroup }: { muscle: Muscle; showGroup: boolean }) {
  const thumb = thumbnailUrl(muscle.id);
  const group = REGIONS.flatMap((r) => r.groups).find((g) => g.id === muscle.groupId);
  const primeAction = muscle.actions.find((a) => a.role === 'prime');
  return (
    <Link to={`/muscles/${muscle.id}`} className="muscle-row">
      {thumb ? <img src={thumb} alt="" className="thumb" loading="lazy" width={56} height={56} /> : <span className="thumb thumb-empty" aria-hidden="true" />}
      <span className="muscle-row-text">
        <span className="muscle-row-name">
          {muscle.name}
          {muscle.layer && <span className="layer-tag">{muscle.layer}</span>}
        </span>
        <span className="muscle-row-meta">
          {showGroup && group ? `${group.name} · ` : ''}
          {formatRoots(rootsOf(muscle))}
          {primeAction ? ` · ${getJoint(primeAction.jointId).name.split(' (')[0]} ${primeAction.movement}` : ''}
        </span>
      </span>
      <span className="chevron" aria-hidden="true">
        <Icon name="chevron" size={18} />
      </span>
    </Link>
  );
}
