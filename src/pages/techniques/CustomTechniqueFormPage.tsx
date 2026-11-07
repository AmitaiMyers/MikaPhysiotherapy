import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { SelectField, TextAreaField, TextField } from '../../components/forms';
import { Empty, PageHeader } from '../../components/ui';
import { JOINTS, MUSCLES, NERVES } from '../../data';
import { CONDITIONS, TECHNIQUE_AREAS, TECHNIQUE_FAMILIES } from '../../data/techniques';
import type { TechniqueAreaId, TechniqueFamilyId } from '../../data/techniqueTypes';
import { matchesWords } from '../../domain/search';
import { parseYouTubeLink, watchUrl } from '../../domain/videos';
import { useAuthorName } from '../../techniques/author';
import { OTHER_FAMILY_LABEL } from '../../techniques/catalog';
import { saveTechniqueRecord, useTechniqueContent } from '../../techniques/store';
import type { CustomTechnique } from '../../techniques/types';
import { MediaGallery, MediaPicker, useMediaEdits } from './Media';
import { Icon } from '../../components/Icon';

const lines = (text: string) =>
  text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

/** New technique (/techniques/new) or edit one of Mika's own (/techniques/:id/edit). */
export function CustomTechniqueFormPage() {
  const { id } = useParams();
  const content = useTechniqueContent();
  const author = useAuthorName();
  // Created once, so the form keeps its state while stored content changes (e.g. after adding a photo).
  const [created] = useState(() => ({ id: crypto.randomUUID(), at: new Date().toISOString() }));
  if (!content.ready) return <p className="muted center">Loading…</p>;
  const existing = id === undefined ? undefined : content.techniques.find((t) => t.id === id);
  if (id !== undefined && existing === undefined) return <Empty>Technique not found.</Empty>;
  const initial: CustomTechnique = existing ?? {
    kind: 'technique',
    id: created.id,
    familyId: null,
    name: '',
    areas: [],
    muscleIds: [],
    jointIds: [],
    nerveIds: [],
    conditionIds: [],
    summary: '',
    position: '',
    steps: [],
    keyPoints: [],
    dosage: '',
    safety: [],
    video: null,
    mediaIds: [],
    author,
    origin: { kind: 'mine' },
    createdAt: created.at,
    updatedAt: created.at,
  };
  return <TechniqueForm key={initial.id} initial={initial} isNew={existing === undefined} />;
}

function TechniqueForm({ initial, isNew }: { initial: CustomTechnique; isNew: boolean }) {
  const navigate = useNavigate();
  const [technique, setTechnique] = useState(initial);
  const [steps, setSteps] = useState(initial.steps.join('\n'));
  const [keyPoints, setKeyPoints] = useState(initial.keyPoints.join('\n'));
  const [safety, setSafety] = useState(initial.safety.join('\n'));
  const [link, setLink] = useState(initial.video === null ? '' : watchUrl(initial.video));
  const media = useMediaEdits(initial.mediaIds);
  const parsed = parseYouTubeLink(link);
  const linkError = link.trim() !== '' && parsed === null;
  const update = (patch: Partial<CustomTechnique>) => setTechnique((current) => ({ ...current, ...patch }));
  const toggle = <T extends string>(list: T[], value: T): T[] => (list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  const valid = technique.name.trim() !== '' && technique.areas.length > 0 && lines(steps).length > 0 && !linkError;
  const conditions = CONDITIONS.filter((c) => technique.areas.length === 0 || c.areas.some((a) => technique.areas.includes(a)));
  const close = (to: string) => void navigate(to, { replace: true });

  return (
    <div className="page">
      <PageHeader back title={isNew ? 'New technique' : technique.name} subtitle="Your own technique, saved on this device" />
      <form
        className="card vault-form"
        onSubmit={(event) => {
          event.preventDefault();
          media.commit();
          saveTechniqueRecord({ ...technique, name: technique.name.trim(), steps: lines(steps), keyPoints: lines(keyPoints), safety: lines(safety), video: parsed, mediaIds: media.ids, updatedAt: new Date().toISOString() });
          close(`/techniques/${technique.id}`);
        }}
      >
        <TextField label="Name" value={technique.name} placeholder="e.g. Dry needling — rhomboids" onChange={(name) => update({ name })} required />
        <SelectField label="Technique family" value={technique.familyId ?? ''} onChange={(value) => update({ familyId: value === '' ? null : (value as TechniqueFamilyId) })}>
          <option value="">{OTHER_FAMILY_LABEL}</option>
          {TECHNIQUE_FAMILIES.map((family) => (
            <option key={family.id} value={family.id}>
              {family.name}
            </option>
          ))}
        </SelectField>
        <fieldset className="field">
          <legend>Body areas (at least one)</legend>
          <div className="chips">
            {TECHNIQUE_AREAS.map((area) => (
              <ToggleChip key={area.id} label={area.name} on={technique.areas.includes(area.id)} onToggle={() => update({ areas: toggle<TechniqueAreaId>(technique.areas, area.id) })} />
            ))}
          </div>
        </fieldset>
        <fieldset className="field">
          <legend>Conditions</legend>
          <div className="chips">
            {conditions.map((condition) => (
              <ToggleChip key={condition.id} label={condition.name} on={technique.conditionIds.includes(condition.id)} onToggle={() => update({ conditionIds: toggle(technique.conditionIds, condition.id) })} />
            ))}
          </div>
        </fieldset>
        <LinkPicker label="Muscles" options={MUSCLES} selected={technique.muscleIds} onChange={(muscleIds) => update({ muscleIds })} />
        <LinkPicker label="Joints" options={JOINTS} selected={technique.jointIds} onChange={(jointIds) => update({ jointIds })} />
        <LinkPicker label="Nerves" options={NERVES} selected={technique.nerveIds} onChange={(nerveIds) => update({ nerveIds })} />
        <TextAreaField label="What it is for" value={technique.summary} onChange={(summary) => update({ summary })} />
        <TextAreaField label="Position (patient and therapist)" value={technique.position} onChange={(position) => update({ position })} />
        <TextAreaField label="Steps — one per line" rows={6} value={steps} onChange={setSteps} />
        <TextAreaField label="Key points — one per line" rows={4} value={keyPoints} onChange={setKeyPoints} />
        <TextField label="Dosage" value={technique.dosage} onChange={(dosage) => update({ dosage })} />
        <TextAreaField label="Safety — one per line" rows={3} value={safety} onChange={setSafety} />
        <TextField label="YouTube video (optional)" type="url" value={link} onChange={setLink} placeholder="https://www.youtube.com/watch?v=…" />
        {linkError && <p className="field-error">That doesn’t look like a YouTube video link.</p>}
        <MediaGallery mediaIds={media.ids} onRemove={media.remove} />
        <MediaPicker onAdded={media.add} />
        <div className="button-row">
          <button type="submit" className="button button-primary" disabled={!valid}>
            {isNew ? 'Create technique' : 'Save'}
          </button>
          <button
            type="button"
            className="text-button"
            onClick={() => {
              media.discard();
              close(isNew ? '/techniques' : `/techniques/${technique.id}`);
            }}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

function ToggleChip({ label, on, onToggle }: { label: string; on: boolean; onToggle: () => void }) {
  return (
    <button type="button" className={`toggle-chip ${on ? 'toggle-chip-on' : ''}`} aria-pressed={on} onClick={onToggle}>
      {label}
    </button>
  );
}

/** Search a list of anatomy items and keep the chosen ones as removable chips. */
function LinkPicker({ label, options, selected, onChange }: { label: string; options: { id: string; name: string }[]; selected: string[]; onChange: (ids: string[]) => void }) {
  const [text, setText] = useState('');
  const matches = text.trim() === '' ? [] : options.filter((o) => !selected.includes(o.id) && matchesWords(text, [o.name])).slice(0, 6);
  const nameOf = (id: string) => options.find((o) => o.id === id)?.name ?? id;
  return (
    <div className="field">
      <span>{label}</span>
      {selected.length > 0 && (
        <div className="chips">
          {selected.map((id) => (
            <button key={id} type="button" className="toggle-chip toggle-chip-on" aria-label={`Remove ${nameOf(id)}`} onClick={() => onChange(selected.filter((s) => s !== id))}>
              {nameOf(id)} <Icon name="close" size={14} />
            </button>
          ))}
        </div>
      )}
      <input className="search-input" type="search" placeholder={`Add ${label.toLowerCase()}…`} value={text} onChange={(event) => setText(event.target.value)} aria-label={`Search ${label.toLowerCase()}`} />
      {matches.length > 0 && (
        <ul className="link-list picker-results">
          {matches.map((match) => (
            <li key={match.id}>
              <button
                type="button"
                className="text-button"
                onClick={() => {
                  onChange([...selected, match.id]);
                  setText('');
                }}
              >
                {match.name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
