import { Link } from 'react-router';
import { DIFFICULTY_LABELS, EQUIPMENT_LABELS, EXERCISE_TYPE_LABELS } from '../data/exercises';
import type { Exercise } from '../data/exerciseTypes';
import { thumbnailUrl } from '../data/images';
import { Icon } from './Icon';

/** Equipment worth mentioning: "No equipment" only when nothing else is listed. */
export function equipmentLabels(exercise: Exercise): string[] {
  const items = exercise.equipment.length > 1 ? exercise.equipment.filter((item) => item !== 'none') : exercise.equipment;
  return items.map((item) => EQUIPMENT_LABELS[item]);
}

export function ExerciseList({ exercises }: { exercises: Exercise[] }) {
  return (
    <ul className="muscle-list">
      {exercises.map((exercise) => (
        <li key={exercise.id}>
          <ExerciseRow exercise={exercise} />
        </li>
      ))}
    </ul>
  );
}

function ExerciseRow({ exercise }: { exercise: Exercise }) {
  const featured = exercise.primaryMuscles[0] ?? exercise.secondaryMuscles[0];
  const thumb = featured === undefined ? null : thumbnailUrl(featured);
  return (
    <Link to={`/rehab/exercises/${exercise.id}`} className="muscle-row">
      {thumb ? <img src={thumb} alt="" className="thumb" loading="lazy" width={56} height={56} /> : <span className="thumb thumb-empty" aria-hidden="true" />}
      <span className="muscle-row-text">
        <span className="muscle-row-name">{exercise.name}</span>
        <span className="muscle-row-meta">
          {[EXERCISE_TYPE_LABELS[exercise.type], DIFFICULTY_LABELS[exercise.difficulty], ...equipmentLabels(exercise)].join(' · ')}
        </span>
      </span>
      <span className="chevron" aria-hidden="true">
        <Icon name="chevron" size={18} />
      </span>
    </Link>
  );
}
