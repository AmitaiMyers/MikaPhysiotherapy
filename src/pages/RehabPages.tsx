import { useState } from 'react';
import { Link, useParams } from 'react-router';
import { equipmentLabels, ExerciseList } from '../components/ExerciseList';
import { BulletSection, Card, Disclaimer, Empty, MuscleLink, Note, PageHeader, ShareButton, SourcesSection } from '../components/ui';
import { useUrlParams } from '../components/useUrlParams';
import { getMuscle, getNerve, MUSCLES, REGIONS } from '../data';
import {
  DIFFICULTY_LABELS,
  EQUIPMENT_LABELS,
  EXERCISE_REGIONS,
  EXERCISE_TYPE_LABELS,
  EXERCISES,
  findExercise,
  getExercise,
  getExerciseGroup,
  getExerciseRegion,
  videoSearchUrl,
} from '../data/exercises';
import type { Difficulty, Equipment, Exercise, ExerciseType } from '../data/exerciseTypes';
import { muscleViews } from '../data/images';
import { filterExercises, hasActiveExerciseFilters, type ExerciseFilters } from '../domain/exerciseSearch';
import { shareExercise } from '../domain/share';

const isTargeted = (muscleId: string) => EXERCISES.some((e) => e.primaryMuscles.includes(muscleId) || e.secondaryMuscles.includes(muscleId));
const MUSCLE_OPTIONS = REGIONS.map((region) => ({
  region,
  muscles: MUSCLES.filter((m) => m.regionId === region.id && isTargeted(m.id)).sort((a, b) => a.name.localeCompare(b.name)),
}));
const EQUIPMENT_OPTIONS = (Object.keys(EQUIPMENT_LABELS) as Equipment[]).filter((item) => EXERCISES.some((e) => e.equipment.includes(item)));

function useExerciseFilters(): [ExerciseFilters, (patch: Partial<ExerciseFilters>) => void, () => void] {
  const [values, update, clear] = useUrlParams({ text: 'q', muscleId: 'muscle', type: 'type', equipment: 'equipment', difficulty: 'level' });
  const filters: ExerciseFilters = {
    text: values.text ?? '',
    muscleId: values.muscleId,
    type: values.type as ExerciseType | null,
    equipment: values.equipment as Equipment | null,
    difficulty: values.difficulty as Difficulty | null,
  };
  return [filters, update, clear];
}

export function ExercisesPage() {
  const [filters, update, clear] = useExerciseFilters();
  const [showFilters, setShowFilters] = useState(hasActiveExerciseFilters({ ...filters, text: '' }));
  const active = hasActiveExerciseFilters(filters);
  const results = filterExercises(EXERCISES, filters);

  return (
    <div className="page">
      <PageHeader title="Rehab" subtitle={`${EXERCISES.length} exercises · by body region`} />
      <div className="search-row">
        <input
          type="search"
          className="search-input"
          placeholder="Search exercises"
          value={filters.text}
          onChange={(event) => update({ text: event.target.value })}
          aria-label="Search exercises"
        />
        <button type="button" className={`button ${showFilters ? 'button-active' : ''}`} onClick={() => setShowFilters((v) => !v)} aria-expanded={showFilters}>
          Filters
        </button>
      </div>
      {showFilters && <ExerciseFilterPanel filters={filters} update={update} />}
      {active ? (
        <section className="card list-card">
          <div className="results-header">
            <h2>
              {results.length} {results.length === 1 ? 'exercise' : 'exercises'}
            </h2>
            <button type="button" className="text-button" onClick={clear}>
              Clear
            </button>
          </div>
          {results.length === 0 ? <Empty>No exercise matches these filters.</Empty> : <ExerciseList exercises={results} />}
        </section>
      ) : (
        <GroupedExercises />
      )}
      <Disclaimer />
    </div>
  );
}

function ExerciseFilterPanel({ filters, update }: { filters: ExerciseFilters; update: (patch: Partial<ExerciseFilters>) => void }) {
  return (
    <section className="card filter-panel" aria-label="Filters">
      <label className="field">
        <span>Muscle</span>
        <select value={filters.muscleId ?? ''} onChange={(e) => update({ muscleId: e.target.value || null })}>
          <option value="">Any muscle</option>
          {MUSCLE_OPTIONS.map(({ region, muscles }) => (
            <optgroup key={region.id} label={region.name}>
              {muscles.map((muscle) => (
                <option key={muscle.id} value={muscle.id}>
                  {muscle.name}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </label>
      <label className="field">
        <span>Type</span>
        <select value={filters.type ?? ''} onChange={(e) => update({ type: (e.target.value || null) as ExerciseType | null })}>
          <option value="">Any type</option>
          {(Object.keys(EXERCISE_TYPE_LABELS) as ExerciseType[]).map((type) => (
            <option key={type} value={type}>
              {EXERCISE_TYPE_LABELS[type]}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        <span>Equipment</span>
        <select value={filters.equipment ?? ''} onChange={(e) => update({ equipment: (e.target.value || null) as Equipment | null })}>
          <option value="">Any equipment</option>
          {EQUIPMENT_OPTIONS.map((item) => (
            <option key={item} value={item}>
              {EQUIPMENT_LABELS[item]}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        <span>Level</span>
        <select value={filters.difficulty ?? ''} onChange={(e) => update({ difficulty: (e.target.value || null) as Difficulty | null })}>
          <option value="">Any level</option>
          {(Object.keys(DIFFICULTY_LABELS) as Difficulty[]).map((level) => (
            <option key={level} value={level}>
              {DIFFICULTY_LABELS[level]}
            </option>
          ))}
        </select>
      </label>
    </section>
  );
}

function GroupedExercises() {
  return (
    <>
      {EXERCISE_REGIONS.map((region) => (
        <details key={region.id} className="region" open>
          <summary className="region-summary">
            <span>{region.name}</span>
            <span className="count">{EXERCISES.filter((e) => e.regionId === region.id).length}</span>
          </summary>
          {region.groups.map((group) => {
            const exercises = EXERCISES.filter((e) => e.groupId === group.id);
            return (
              <details key={group.id} className="card group">
                <summary className="group-summary">
                  <span className="group-name">{group.name}</span>
                  <span className="count">{exercises.length}</span>
                </summary>
                <p className="group-description">{group.description}</p>
                <ExerciseList exercises={exercises} />
              </details>
            );
          })}
        </details>
      ))}
    </>
  );
}

export function ExerciseDetailPage() {
  const { id = '' } = useParams();
  const exercise = findExercise(id);
  if (!exercise) return <Empty>Exercise not found.</Empty>;
  return (
    <div className="page" key={exercise.id}>
      <PageHeader
        back
        title={exercise.name}
        subtitle={exercise.aliases.length > 0 ? exercise.aliases.join(' · ') : undefined}
        actions={<ShareButton label="Share exercise" onShare={() => shareExercise(exercise)} />}
      />
      <p className="breadcrumb">
        {getExerciseRegion(exercise.regionId).name} › {getExerciseGroup(exercise.groupId).name}
      </p>
      <div className="tag-row">
        {[EXERCISE_TYPE_LABELS[exercise.type], DIFFICULTY_LABELS[exercise.difficulty], ...equipmentLabels(exercise)].map((label) => (
          <span key={label} className="tag">
            {label}
          </span>
        ))}
      </div>
      <aside className="tip-box">
        <span className="tip-label">Physio tip</span>
        <p>{exercise.tip}</p>
      </aside>
      <TargetsCard exercise={exercise} />
      <Card title="Starting position">
        <p>{exercise.position}</p>
      </Card>
      <Card title="How to do it">
        <ol className="steps">
          {exercise.steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </Card>
      <BulletSection title="Cues" items={exercise.cues} />
      <BulletSection title="Common mistakes" items={exercise.mistakes} />
      <Card title="Dosage">
        <p>{exercise.dosage}</p>
        <Note>A typical starting point; adjust to the patient, their symptoms and the protocol phase.</Note>
      </Card>
      <ProgressionCard exercise={exercise} />
      <BulletSection title="Precautions" items={exercise.precautions} />
      {exercise.evidence !== undefined && (
        <Card title="Evidence">
          <p>{exercise.evidence}</p>
        </Card>
      )}
      <a className="button" href={videoSearchUrl(exercise)} target="_blank" rel="noreferrer">
        Find a video demonstration ↗
      </a>
      <Note>Opens a YouTube search. The videos are not reviewed by this app — check the technique against the steps above.</Note>
      <SourcesSection sourceIds={exercise.sourceIds} />
      <Disclaimer />
    </div>
  );
}

/** Target muscles with their highlighted anatomy images, plus helpers and nerves. */
function TargetsCard({ exercise }: { exercise: Exercise }) {
  return (
    <Card title={exercise.primaryMuscles.length > 0 ? 'Target muscles' : 'Targets'}>
      {exercise.primaryMuscles.length > 0 && (
        <div className="target-strip">
          {exercise.primaryMuscles.map((muscleId) => {
            const image = muscleViews(muscleId)[0];
            return (
              <Link key={muscleId} to={`/muscles/${muscleId}`} className="target-card">
                {image ? <img src={image.url} alt="" loading="lazy" width={120} height={150} /> : <span className="target-image-empty" aria-hidden="true" />}
                <span>{getMuscle(muscleId).name}</span>
              </Link>
            );
          })}
        </div>
      )}
      {exercise.primaryMuscles.length === 0 && exercise.nerveIds.length === 0 && (
        <p className="muted">A passive or assisted movement: the muscles below relax or help rather than drive it.</p>
      )}
      {exercise.nerveIds.length > 0 && (
        <>
          <h3 className="subheading">Nerves mobilised</h3>
          <span className="chips">
            {exercise.nerveIds.map((nerveId) => (
              <Link key={nerveId} className="chip-link" to={`/nerves/${nerveId}`}>
                {getNerve(nerveId).name}
              </Link>
            ))}
          </span>
        </>
      )}
      {exercise.secondaryMuscles.length > 0 && (
        <>
          <h3 className="subheading">{exercise.primaryMuscles.length > 0 ? 'Also working' : 'Muscles involved'}</h3>
          <span className="chips chip-assist">
            {exercise.secondaryMuscles.map((muscleId) => (
              <MuscleLink key={muscleId} id={muscleId} />
            ))}
          </span>
        </>
      )}
    </Card>
  );
}

function ProgressionCard({ exercise }: { exercise: Exercise }) {
  if (exercise.regressionIds.length === 0 && exercise.progressionIds.length === 0) return null;
  return (
    <Card title="Easier & harder">
      <ExerciseLinks label="Easier" ids={exercise.regressionIds} />
      <ExerciseLinks label="Harder" ids={exercise.progressionIds} />
    </Card>
  );
}

function ExerciseLinks({ label, ids }: { label: string; ids: string[] }) {
  if (ids.length === 0) return null;
  return (
    <div className="related">
      <span className="related-label">{label}</span>
      <ul className="link-list">
        {ids.map((id) => (
          <li key={id}>
            <Link to={`/rehab/exercises/${id}`}>{getExercise(id).name}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
