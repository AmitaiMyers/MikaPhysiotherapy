import { useState } from 'react';
import { NumberField, TextAreaField, TextField } from '../../../components/forms';
import { getJoint, JOINTS, SPECIAL_TESTS, getSpecialTest } from '../../../data';
import { OUTCOME_MEASURES } from '../../../patients/sessions';
import { MMT_GRADES, type MmtGrade, type SessionContent, type Side, type TestResult } from '../../../patients/types';
import { removeWithUndo, replaceAt } from './listEdit';
import { EntryRow, SessionSection, SideSelect } from './SessionSection';
import { Segmented } from '../../../components/Segmented';

type Objective = SessionContent['objective'];
/** `onChange` receives only the changed fields; the session merges them into its latest objective. */
type Props = { objective: Objective; defaultSide: Side; onChange: (patch: Partial<Objective>) => void };

/** Joints with measurable range: those with a normal range, plus the spine. */
const JOINTS_WITH_ROM = JOINTS.filter((joint) => joint.movements.some((m) => m.rangeDegrees !== undefined) || ['cervical-spine', 'trunk'].includes(joint.id));
const capitalise = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

export function ObjectiveSections({ objective, defaultSide, onChange }: Props) {
  const set = onChange;
  return (
    <>
      <RomSection objective={objective} defaultSide={defaultSide} set={set} />
      <StrengthSection objective={objective} defaultSide={defaultSide} set={set} />
      <TestsSection objective={objective} defaultSide={defaultSide} set={set} />
      <OutcomesSection objective={objective} set={set} />
      <GirthSection objective={objective} defaultSide={defaultSide} set={set} />
      <SessionSection title="Movement & observation" count={objective.movement === '' ? 0 : 1}>
        <TextAreaField label="Movement, gait and posture observation" rows={4} value={objective.movement} onChange={(movement) => set({ movement })} />
        <TextAreaField label="Other objective findings" value={objective.notes} onChange={(notes) => set({ notes })} />
      </SessionSection>
    </>
  );
}

type SectionProps = { objective: Objective; defaultSide: Side; set: (patch: Partial<Objective>) => void };

function RomSection({ objective, defaultSide, set }: SectionProps) {
  const [jointId, setJointId] = useState(JOINTS_WITH_ROM.find((j) => j.id === 'knee')?.id ?? '');
  const joint = getJoint(jointId);
  const [movement, setMovement] = useState(joint.movements[0]?.name ?? '');
  const rom = objective.rom;
  return (
    <SessionSection title="Range of motion" count={rom.length}>
      {rom.map((entry, index) => {
        const normal = getJoint(entry.jointId).movements.find((m) => m.name === entry.movement)?.rangeDegrees;
        return (
          <EntryRow
            key={`${entry.jointId}-${entry.movement}-${index}`}
            title={`${getJoint(entry.jointId).name}: ${capitalise(entry.movement)}${normal === undefined ? '' : ` (normal ${normal}°)`}`}
            onRemove={() => removeWithUndo(rom, index, (next) => set({ rom: next }), 'Range of motion')}
          >
            <SideSelect value={entry.side} onChange={(side) => set({ rom: replaceAt(rom, index, { side }) })} />
            <NumberField label="Active °" value={entry.active} onChange={(active) => set({ rom: replaceAt(rom, index, { active }) })} />
            <NumberField label="Passive °" value={entry.passive} onChange={(passive) => set({ rom: replaceAt(rom, index, { passive }) })} />
          </EntryRow>
        );
      })}
      <div className="add-row">
        <select
          aria-label="Joint"
          value={jointId}
          onChange={(event) => {
            setJointId(event.target.value);
            setMovement(getJoint(event.target.value).movements[0]?.name ?? '');
          }}
        >
          {JOINTS_WITH_ROM.map((j) => (
            <option key={j.id} value={j.id}>
              {j.name}
            </option>
          ))}
        </select>
        <select aria-label="Movement" value={movement} onChange={(event) => setMovement(event.target.value)}>
          {joint.movements.map((m) => (
            <option key={m.name} value={m.name}>
              {capitalise(m.name)}
            </option>
          ))}
        </select>
        <button type="button" className="button" onClick={() => set({ rom: [...rom, { jointId, movement, side: defaultSide, active: null, passive: null, note: '' }] })}>
          Add
        </button>
      </div>
    </SessionSection>
  );
}

function StrengthSection({ objective, defaultSide, set }: SectionProps) {
  const [label, setLabel] = useState('');
  const strength = objective.strength;
  return (
    <SessionSection title="Strength" count={strength.length}>
      {strength.map((entry, index) => (
        <EntryRow key={`${entry.label}-${index}`} title={entry.label} onRemove={() => removeWithUndo(strength, index, (next) => set({ strength: next }), 'Strength test')}>
          <SideSelect value={entry.side} onChange={(side) => set({ strength: replaceAt(strength, index, { side }) })} />
          <label className="field">
            <span>MMT</span>
            <select value={entry.mmt ?? ''} onChange={(event) => set({ strength: replaceAt(strength, index, { mmt: event.target.value === '' ? null : (event.target.value as MmtGrade) }) })}>
              <option value="">—</option>
              {MMT_GRADES.map((grade) => (
                <option key={grade} value={grade}>
                  {grade}/5
                </option>
              ))}
            </select>
          </label>
          <NumberField label="Dynamometer kg" step={0.1} value={entry.dynamometerKg} onChange={(dynamometerKg) => set({ strength: replaceAt(strength, index, { dynamometerKg }) })} />
        </EntryRow>
      ))}
      <form
        className="add-row"
        onSubmit={(event) => {
          event.preventDefault();
          set({ strength: [...strength, { label: label.trim(), muscleId: null, side: defaultSide, mmt: null, dynamometerKg: null, note: '' }] });
          setLabel('');
        }}
      >
        <input className="search-input" placeholder="e.g. Knee extension, Gluteus medius" value={label} onChange={(event) => setLabel(event.target.value)} aria-label="Strength test" />
        <button type="submit" className="button" disabled={label.trim() === ''}>
          Add
        </button>
      </form>
    </SessionSection>
  );
}

const RESULT_LABELS: Record<TestResult, string> = { positive: '+', negative: '−', inconclusive: '?' };

function TestsSection({ objective, defaultSide, set }: SectionProps) {
  const [testId, setTestId] = useState(SPECIAL_TESTS[0]?.id ?? '');
  const tests = objective.tests;
  const sorted = [...SPECIAL_TESTS].sort((a, b) => a.name.localeCompare(b.name));
  return (
    <SessionSection title="Special tests" count={tests.length}>
      {tests.map((entry, index) => (
        <EntryRow key={`${entry.testId}-${index}`} title={getSpecialTest(entry.testId).name} onRemove={() => removeWithUndo(tests, index, (next) => set({ tests: next }), 'Special test')}>
          <SideSelect value={entry.side} onChange={(side) => set({ tests: replaceAt(tests, index, { side }) })} />
          <Segmented label="Result" value={entry.result} onChange={(result) => set({ tests: replaceAt(tests, index, { result }) })} options={(Object.keys(RESULT_LABELS) as TestResult[]).map((result) => ({ value: result, label: RESULT_LABELS[result], ariaLabel: result }))} />
          <TextField label="Note" value={entry.note} onChange={(note) => set({ tests: replaceAt(tests, index, { note }) })} />
        </EntryRow>
      ))}
      <div className="add-row">
        <select aria-label="Special test" value={testId} onChange={(event) => setTestId(event.target.value)}>
          {sorted.map((test) => (
            <option key={test.id} value={test.id}>
              {test.name}
            </option>
          ))}
        </select>
        <button type="button" className="button" onClick={() => set({ tests: [...tests, { testId, side: defaultSide, result: null, note: '' }] })}>
          Add
        </button>
      </div>
    </SessionSection>
  );
}

function OutcomesSection({ objective, set }: Omit<SectionProps, 'defaultSide'>) {
  const [measure, setMeasure] = useState('');
  const outcomes = objective.outcomes;
  return (
    <SessionSection title="Outcome measures" count={outcomes.length}>
      {outcomes.map((entry, index) => (
        <EntryRow key={`${entry.measure}-${index}`} title={entry.measure} onRemove={() => removeWithUndo(outcomes, index, (next) => set({ outcomes: next }), 'Outcome measure')}>
          <NumberField label="Score" step={0.1} value={entry.score} onChange={(score) => set({ outcomes: replaceAt(outcomes, index, { score }) })} />
        </EntryRow>
      ))}
      <form
        className="add-row"
        onSubmit={(event) => {
          event.preventDefault();
          set({ outcomes: [...outcomes, { measure: measure.trim(), score: null, note: '' }] });
          setMeasure('');
        }}
      >
        <input className="search-input" list="outcome-measures" placeholder="e.g. KOOS" value={measure} onChange={(event) => setMeasure(event.target.value)} aria-label="Outcome measure" />
        <datalist id="outcome-measures">
          {OUTCOME_MEASURES.map((name) => (
            <option key={name} value={name} />
          ))}
        </datalist>
        <button type="submit" className="button" disabled={measure.trim() === ''}>
          Add
        </button>
      </form>
    </SessionSection>
  );
}

function GirthSection({ objective, defaultSide, set }: SectionProps) {
  const [site, setSite] = useState('');
  const girth = objective.girth;
  return (
    <SessionSection title="Girth & swelling" count={girth.length}>
      {girth.map((entry, index) => (
        <EntryRow key={`${entry.site}-${index}`} title={entry.site} onRemove={() => removeWithUndo(girth, index, (next) => set({ girth: next }), 'Girth measure')}>
          <SideSelect value={entry.side} onChange={(side) => set({ girth: replaceAt(girth, index, { side }) })} />
          <NumberField label="cm" step={0.1} value={entry.cm} onChange={(cm) => set({ girth: replaceAt(girth, index, { cm }) })} />
        </EntryRow>
      ))}
      <form
        className="add-row"
        onSubmit={(event) => {
          event.preventDefault();
          set({ girth: [...girth, { site: site.trim(), side: defaultSide, cm: null }] });
          setSite('');
        }}
      >
        <input className="search-input" placeholder="e.g. Mid-patella, 10 cm above patella" value={site} onChange={(event) => setSite(event.target.value)} aria-label="Measurement site" />
        <button type="submit" className="button" disabled={site.trim() === ''}>
          Add
        </button>
      </form>
    </SessionSection>
  );
}
