import { useState } from 'react';
import { Link } from 'react-router';
import { matchesWords } from '../../../domain/search';
import type { EpisodeSide, PlannedTechnique, SessionTechnique } from '../../../patients/types';
import { sessionFieldsFor, techniqueName, techniqueOptions } from '../../../techniques/catalog';
import { useTechniqueContent } from '../../../techniques/store';
import type { CustomTechnique } from '../../../techniques/types';
import { SIDE_LABELS } from '../EpisodeSummary';
import { removeAt, removeWithUndo, replaceAt } from './listEdit';
import { SessionSection } from './SessionSection';
import { Icon } from '../../../components/Icon';

/** Techniques applied in a session, each with its family's dosage fields. */
export function TechniquesSection({ techniques, plan, defaultSide, onChange }: { techniques: SessionTechnique[]; plan: PlannedTechnique[]; defaultSide: EpisodeSide; onChange: (techniques: SessionTechnique[]) => void }) {
  const { techniques: customs } = useTechniqueContent();
  const add = (techniqueIds: string[]) => onChange([...techniques, ...techniqueIds.map((techniqueId) => ({ techniqueId, side: defaultSide, values: {}, response: '', adverseEvent: '' }))]);
  const missingFromPlan = plan.filter((p) => !techniques.some((t) => t.techniqueId === p.techniqueId));
  return (
    <SessionSection title="Techniques" count={techniques.length}>
      {techniques.map((entry, index) => (
        <TechniqueLog key={`${entry.techniqueId}-${index}`} entry={entry} customs={customs} onChange={(patch) => onChange(replaceAt(techniques, index, patch))} onRemove={() => removeWithUndo(techniques, index, onChange, 'Technique')} />
      ))}
      {missingFromPlan.length > 0 && (
        <button type="button" className="text-button small" onClick={() => add(missingFromPlan.map((p) => p.techniqueId))}>
          <Icon name="plus" size={18} /> Add from the care plan ({missingFromPlan.map((p) => techniqueName(p.techniqueId, customs)).join(', ')})
        </button>
      )}
      <TechniquePicker customs={customs} onPick={(id) => add([id])} />
    </SessionSection>
  );
}

function TechniqueLog({ entry, customs, onChange, onRemove }: { entry: SessionTechnique; customs: CustomTechnique[]; onChange: (patch: Partial<SessionTechnique>) => void; onRemove: () => void }) {
  const name = techniqueName(entry.techniqueId, customs);
  return (
    <div className="entry-row">
      <div className="entry-row-header">
        <span className="entry-title">
          <Link to={`/techniques/${entry.techniqueId}`}>{name}</Link>
        </span>
        <button type="button" className="icon-button small-icon" aria-label={`Remove ${name}`} onClick={onRemove}>
          <Icon name="close" size={18} />
        </button>
      </div>
      <div className="entry-fields technique-fields">
        <label className="field">
          <span>Side</span>
          <select value={entry.side} onChange={(event) => onChange({ side: event.target.value as EpisodeSide })}>
            {(Object.keys(SIDE_LABELS) as EpisodeSide[]).map((side) => (
              <option key={side} value={side}>
                {side === 'none' ? 'Central' : SIDE_LABELS[side]}
              </option>
            ))}
          </select>
        </label>
        {sessionFieldsFor(entry.techniqueId, customs).map((field) => (
          <label key={field.key} className="field">
            <span>{field.label}</span>
            <input className="search-input" placeholder={field.placeholder} value={entry.values[field.key] ?? ''} onChange={(event) => onChange({ values: { ...entry.values, [field.key]: event.target.value } })} />
          </label>
        ))}
        <label className="field">
          <span>Response</span>
          <input className="search-input" placeholder="e.g. rotation +15°, pain 6→3" value={entry.response} onChange={(event) => onChange({ response: event.target.value })} />
        </label>
        <label className="field">
          <span>Adverse event</span>
          <input className="search-input" placeholder="e.g. bruising, soreness — or leave empty" value={entry.adverseEvent} onChange={(event) => onChange({ adverseEvent: event.target.value })} />
        </label>
      </div>
    </div>
  );
}

/** Search built-in and custom techniques to add one. */
export function TechniquePicker({ customs, onPick }: { customs: CustomTechnique[]; onPick: (techniqueId: string) => void }) {
  const [text, setText] = useState('');
  const matches = text.trim() === '' ? [] : techniqueOptions(customs).filter((o) => matchesWords(text, [o.name, o.group])).slice(0, 8);
  return (
    <div className="exercise-picker">
      <input className="search-input" type="search" placeholder="Add technique — e.g. dry needling trapezius" value={text} onChange={(event) => setText(event.target.value)} aria-label="Search techniques to add" />
      {matches.length > 0 && (
        <ul className="link-list picker-results">
          {matches.map((match) => (
            <li key={match.id}>
              <button
                type="button"
                className="text-button"
                onClick={() => {
                  onPick(match.id);
                  setText('');
                }}
              >
                {match.name}
                <span className="muted small"> · {match.group}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** The care plan of an episode: techniques to use in its sessions, with a note each. */
export function PlannedTechniquesCard({ plan, onChange }: { plan: PlannedTechnique[]; onChange: (plan: PlannedTechnique[]) => void }) {
  const { techniques: customs } = useTechniqueContent();
  return (
    <section className="card">
      <h2>Care plan — techniques</h2>
      <p className="muted small">New sessions in this episode start with these techniques.</p>
      {plan.map((item, index) => {
        const name = techniqueName(item.techniqueId, customs);
        return (
          <div key={`${item.techniqueId}-${index}`} className="entry-row">
            <div className="entry-row-header">
              <span className="entry-title">
                <Link to={`/techniques/${item.techniqueId}`}>{name}</Link>
              </span>
              <button type="button" className="icon-button small-icon" aria-label={`Remove ${name}`} onClick={() => onChange(removeAt(plan, index))}>
                <Icon name="close" size={18} />
              </button>
            </div>
            <input className="search-input" placeholder="Note, e.g. weekly for 4 weeks" value={item.note} onChange={(event) => onChange(replaceAt(plan, index, { note: event.target.value }))} aria-label={`${name} note`} />
          </div>
        );
      })}
      <TechniquePicker customs={customs} onPick={(techniqueId) => onChange([...plan, { techniqueId, note: '' }])} />
    </section>
  );
}
