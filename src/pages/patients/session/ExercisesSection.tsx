import { useState } from 'react';
import { Link } from 'react-router';
import { EXERCISES, findExercise } from '../../../data/exercises';
import { matchesWords } from '../../../domain/search';
import { newId } from '../../../patients/records';
import { emptySet } from '../../../patients/sessions';
import type { CustomExercise, SessionExercise, SessionSet } from '../../../patients/types';
import { saveRecord, useRecords } from '../../../patients/vault';
import { removeAt, replaceAt } from './listEdit';
import { SessionSection } from './SessionSection';

/** A Rehab exercise name, or a custom exercise name. */
export function exerciseLabel(exerciseId: string, customs: CustomExercise[]): string {
  return findExercise(exerciseId)?.name ?? customs.find((c) => c.id === exerciseId)?.name ?? 'Deleted exercise';
}

export function ExercisesSection({ exercises, onChange }: { exercises: SessionExercise[]; onChange: (exercises: SessionExercise[]) => void }) {
  const customs = useRecords('customExercise');
  return (
    <SessionSection title="Exercises" count={exercises.length}>
      {exercises.map((exercise, index) => (
        <ExerciseLog
          key={`${exercise.exerciseId}-${index}`}
          exercise={exercise}
          name={exerciseLabel(exercise.exerciseId, customs)}
          isCustom={findExercise(exercise.exerciseId) === undefined}
          onChange={(patch) => onChange(replaceAt(exercises, index, patch))}
          onRemove={() => onChange(removeAt(exercises, index))}
        />
      ))}
      <ExercisePicker customs={customs} onPick={(exerciseId) => onChange([...exercises, { exerciseId, sets: [emptySet()], note: '' }])} />
    </SessionSection>
  );
}

const SET_FIELDS: { key: keyof SessionSet; label: string; step: number }[] = [
  { key: 'reps', label: 'Reps', step: 1 },
  { key: 'weightKg', label: 'kg', step: 0.5 },
  { key: 'durationSec', label: 'Sec', step: 5 },
  { key: 'rpe', label: 'RPE', step: 0.5 },
];

function ExerciseLog({ exercise, name, isCustom, onChange, onRemove }: { exercise: SessionExercise; name: string; isCustom: boolean; onChange: (patch: Partial<SessionExercise>) => void; onRemove: () => void }) {
  const setSet = (index: number, patch: Partial<SessionSet>) => onChange({ sets: replaceAt(exercise.sets, index, patch) });
  return (
    <div className="entry-row">
      <div className="entry-row-header">
        <span className="entry-title">{isCustom ? name : <Link to={`/rehab/exercises/${exercise.exerciseId}`}>{name}</Link>}</span>
        <button type="button" className="icon-button small-icon" aria-label={`Remove ${name}`} onClick={onRemove}>
          ×
        </button>
      </div>
      <table className="set-table">
        <thead>
          <tr>
            <th>Set</th>
            {SET_FIELDS.map((field) => (
              <th key={field.key}>{field.label}</th>
            ))}
            <th aria-label="Remove" />
          </tr>
        </thead>
        <tbody>
          {exercise.sets.map((set, index) => (
            <tr key={index}>
              <td>{index + 1}</td>
              {SET_FIELDS.map((field) => (
                <td key={field.key}>
                  <input
                    className="set-input"
                    type="number"
                    inputMode="decimal"
                    step={field.step}
                    aria-label={`Set ${index + 1} ${field.label}`}
                    value={set[field.key] ?? ''}
                    onChange={(event) => setSet(index, { [field.key]: event.target.value === '' ? null : Number(event.target.value) })}
                  />
                </td>
              ))}
              <td>
                <button type="button" className="text-button small" aria-label={`Remove set ${index + 1}`} onClick={() => onChange({ sets: removeAt(exercise.sets, index) })}>
                  ×
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="button-row">
        <button type="button" className="text-button small" onClick={() => onChange({ sets: [...exercise.sets, { ...(exercise.sets.at(-1) ?? emptySet()) }] })}>
          ＋ Add set
        </button>
      </div>
      <input className="search-input" placeholder="Note (side, cues, pain response…)" value={exercise.note} onChange={(event) => onChange({ note: event.target.value })} aria-label={`${name} note`} />
    </div>
  );
}

function ExercisePicker({ customs, onPick }: { customs: CustomExercise[]; onPick: (exerciseId: string) => void }) {
  const [text, setText] = useState('');
  const matches = text.trim() === '' ? [] : [...customs.map((c) => ({ id: c.id, name: c.name, custom: true })), ...EXERCISES.map((e) => ({ id: e.id, name: e.name, custom: false }))].filter((e) => matchesWords(text, [e.name])).slice(0, 8);
  const pick = (id: string) => {
    onPick(id);
    setText('');
  };
  return (
    <div className="exercise-picker">
      <input className="search-input" type="search" placeholder="Add exercise — search the Rehab exercises" value={text} onChange={(event) => setText(event.target.value)} aria-label="Search exercises to add" />
      {matches.length > 0 && (
        <ul className="link-list picker-results">
          {matches.map((match) => (
            <li key={match.id}>
              <button type="button" className="text-button" onClick={() => pick(match.id)}>
                {match.name}
                {match.custom && <span className="muted small"> · custom</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
      {text.trim() !== '' && (
        <button
          type="button"
          className="text-button small"
          onClick={() => {
            const custom: CustomExercise = { id: newId(), name: text.trim(), notes: '' };
            saveRecord('customExercise', custom);
            pick(custom.id);
          }}
        >
          ＋ Create custom exercise “{text.trim()}”
        </button>
      )}
    </div>
  );
}
