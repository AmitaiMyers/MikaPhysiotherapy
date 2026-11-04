import { useState } from 'react';
import { Link } from 'react-router';
import { NumberField, TextAreaField } from '../../../components/forms';
import { findExercise, getExercise } from '../../../data/exercises';
import type { Protocol } from '../../../data/protocolTypes';
import { useProgrammes } from '../../../domain/programmeStore';
import { MODALITIES } from '../../../patients/sessions';
import type { SessionContent } from '../../../patients/types';
import { removeAt, replaceAt } from './listEdit';
import { SessionSection } from './SessionSection';

type Content = SessionContent;

export function SubjectiveSection({ subjective, onChange }: { subjective: Content['subjective']; onChange: (s: Content['subjective']) => void }) {
  const pain = subjective.pain;
  return (
    <SessionSection letter="S" title="Subjective" defaultOpen count={subjective.notes === '' ? 0 : 1}>
      <div className="field-row three">
        <NumberField label="Pain at rest (0–10)" min={0} max={10} value={pain.rest} onChange={(rest) => onChange({ ...subjective, pain: { ...pain, rest } })} />
        <NumberField label="On activity" min={0} max={10} value={pain.activity} onChange={(activity) => onChange({ ...subjective, pain: { ...pain, activity } })} />
        <NumberField label="Worst (24 h)" min={0} max={10} value={pain.worst} onChange={(worst) => onChange({ ...subjective, pain: { ...pain, worst } })} />
      </div>
      <TextAreaField label="How they are, changes since last time" rows={4} value={subjective.notes} onChange={(notes) => onChange({ ...subjective, notes })} />
    </SessionSection>
  );
}

export function TreatmentSection({ treatment, onChange }: { treatment: Content['treatment']; onChange: (t: Content['treatment']) => void }) {
  const toggle = (modality: string) =>
    onChange({ ...treatment, modalities: treatment.modalities.includes(modality) ? treatment.modalities.filter((m) => m !== modality) : [...treatment.modalities, modality] });
  return (
    <SessionSection title="Treatment" count={treatment.modalities.length}>
      <div className="chips">
        {MODALITIES.map((modality) => (
          <button key={modality} type="button" className={`toggle-chip ${treatment.modalities.includes(modality) ? 'toggle-chip-on' : ''}`} aria-pressed={treatment.modalities.includes(modality)} onClick={() => toggle(modality)}>
            {modality}
          </button>
        ))}
      </div>
      <TextAreaField label="Manual therapy" value={treatment.manualTherapy} onChange={(manualTherapy) => onChange({ ...treatment, manualTherapy })} />
      <TextAreaField label="Education and advice" value={treatment.education} onChange={(education) => onChange({ ...treatment, education })} />
      <TextAreaField label="Other treatment notes" value={treatment.notes} onChange={(notes) => onChange({ ...treatment, notes })} />
    </SessionSection>
  );
}

export function ProtocolSection({ protocol, value, suggestedPhase, onChange }: { protocol: Protocol; value: Content['protocol']; suggestedPhase: number | null; onChange: (p: Content['protocol']) => void }) {
  const phaseIndex = value.phaseIndex ?? suggestedPhase;
  const phase = phaseIndex === null ? undefined : protocol.phases[phaseIndex];
  const toggle = (criterion: string) =>
    onChange({ phaseIndex, criteriaMet: value.criteriaMet.includes(criterion) ? value.criteriaMet.filter((c) => c !== criterion) : [...value.criteriaMet, criterion] });
  return (
    <SessionSection title={`Protocol — ${protocol.name}`} count={value.criteriaMet.length}>
      <label className="field">
        <span>Phase</span>
        <select value={phaseIndex ?? ''} onChange={(event) => onChange({ phaseIndex: event.target.value === '' ? null : Number(event.target.value), criteriaMet: [] })}>
          <option value="">Choose the phase</option>
          {protocol.phases.map((p, index) => (
            <option key={p.name} value={index}>
              {index + 1}. {p.name} ({p.timeframe})
            </option>
          ))}
        </select>
      </label>
      {phase !== undefined && (
        <>
          <p className="small spaced-top">{phase.protection.join(' ')}</p>
          {phase.criteria.length > 0 && <h3 className="subheading">Criteria to progress — tick the ones met</h3>}
          <ul className="checklist">
            {phase.criteria.map((criterion) => (
              <li key={criterion}>
                <label>
                  <input type="checkbox" checked={value.criteriaMet.includes(criterion)} onChange={() => toggle(criterion)} /> {criterion}
                </label>
              </li>
            ))}
          </ul>
          <Link to={`/rehab/protocols/${protocol.id}`} className="small">
            Open the protocol
          </Link>
        </>
      )}
    </SessionSection>
  );
}

export function HomeProgrammeSection({ value, exercises, onChange }: { value: Content['homeProgramme']; exercises: Content['exercises']; onChange: (p: Content['homeProgramme']) => void }) {
  const programmes = useProgrammes();
  const [choice, setChoice] = useState('');
  return (
    <SessionSection title="Home exercise programme" count={value?.items.length ?? 0}>
      {value === null ? (
        <p className="muted small">No home programme recorded for this session.</p>
      ) : (
        <>
          <p className="entry-title">{value.title}</p>
          <ol className="steps small">
            {value.items.map((item, index) => (
              <li key={item.exerciseId}>
                {getExercise(item.exerciseId).name} — {item.dosage}
                <button type="button" className="text-button small" onClick={() => onChange({ ...value, items: removeAt(value.items, index) })}>
                  remove
                </button>
              </li>
            ))}
          </ol>
          <button type="button" className="text-button small" onClick={() => onChange(null)}>
            Clear
          </button>
        </>
      )}
      <div className="add-row">
        <select aria-label="Programme" value={choice} onChange={(event) => setChoice(event.target.value)}>
          <option value="">Copy from a programme…</option>
          {programmes.map((programme) => (
            <option key={programme.id} value={programme.id}>
              {programme.title}
            </option>
          ))}
        </select>
        <button
          type="button"
          className="button"
          disabled={choice === ''}
          onClick={() => {
            const programme = programmes.find((p) => p.id === choice);
            if (programme === undefined) return;
            onChange({ title: programme.title, items: programme.items.map((item) => ({ ...item })) });
            setChoice('');
          }}
        >
          Copy
        </button>
      </div>
      {exercises.some((e) => isRehabExercise(e.exerciseId)) && (
        <button
          type="button"
          className="text-button small"
          onClick={() =>
            onChange({
              title: 'Home exercise programme',
              items: exercises.filter((e) => isRehabExercise(e.exerciseId)).map((e) => ({ exerciseId: e.exerciseId, dosage: getExercise(e.exerciseId).dosage, note: e.note })),
            })
          }
        >
          Use this session’s exercises as the home programme
        </button>
      )}
    </SessionSection>
  );
}

function isRehabExercise(exerciseId: string): boolean {
  return findExercise(exerciseId) !== undefined;
}

export function ScoresSection({ scores, subjects, onChange }: { scores: Content['scores']; subjects: string[]; onChange: (scores: Content['scores']) => void }) {
  const [subject, setSubject] = useState('');
  return (
    <SessionSection title="Scores to follow (0–10)" count={scores.length}>
      {scores.map((entry, index) => (
        <div key={`${entry.subject}-${index}`} className="score-row">
          <span className="entry-title">{entry.subject}</span>
          <input type="range" min={0} max={10} step={1} value={entry.value ?? 0} aria-label={`${entry.subject} score`} onChange={(event) => onChange(replaceAt(scores, index, { value: Number(event.target.value) }))} />
          <span className="score-value">{entry.value ?? '–'}</span>
          <button type="button" className="icon-button small-icon" aria-label={`Remove ${entry.subject}`} onClick={() => onChange(removeAt(scores, index))}>
            ×
          </button>
        </div>
      ))}
      <form
        className="add-row"
        onSubmit={(event) => {
          event.preventDefault();
          onChange([...scores, { subject: subject.trim(), value: null }]);
          setSubject('');
        }}
      >
        <input className="search-input" list="score-subjects" placeholder="Subject, e.g. Function, Confidence" value={subject} onChange={(event) => setSubject(event.target.value)} aria-label="Score subject" />
        <datalist id="score-subjects">
          {subjects.filter((s) => !scores.some((entry) => entry.subject === s)).map((s) => (
            <option key={s} value={s} />
          ))}
        </datalist>
        <button type="submit" className="button" disabled={subject.trim() === ''}>
          Add
        </button>
      </form>
    </SessionSection>
  );
}
