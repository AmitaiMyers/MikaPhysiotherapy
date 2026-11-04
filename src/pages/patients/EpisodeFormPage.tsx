import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { SelectField, TextAreaField, TextField } from '../../components/forms';
import { Empty, PageHeader } from '../../components/ui';
import { PROTOCOL_KIND_LABELS, PROTOCOL_REGIONS, PROTOCOLS } from '../../data/protocols';
import { localDate } from '../../patients/dates';
import { deleteEpisode, emptyEpisode } from '../../patients/records';
import type { Episode, EpisodeSide } from '../../patients/types';
import { getRecord, saveRecord } from '../../patients/vault';
import { AttachmentsCard } from './AttachmentsCard';
import { ProtocolProgress, SIDE_LABELS } from './EpisodeSummary';

/** New episode (/episodes/new) or edit an existing one. */
export function EpisodeFormPage() {
  const { id = '', episodeId = 'new' } = useParams();
  const patient = getRecord('patient', id);
  const existing = episodeId === 'new' ? undefined : getRecord('episode', episodeId);
  if (patient === undefined || (episodeId !== 'new' && existing === undefined)) return <Empty>Not found.</Empty>;
  return <EpisodeForm key={episodeId} initial={existing ?? emptyEpisode(patient.id)} isNew={existing === undefined} patientName={patient.firstName} />;
}

function EpisodeForm({ initial, isNew, patientName }: { initial: Episode; isNew: boolean; patientName: string }) {
  const navigate = useNavigate();
  const [episode, setEpisode] = useState(initial);
  const update = (patch: Partial<Episode>) => setEpisode((current) => ({ ...current, ...patch }));
  const backToFolder = () => void navigate(`/patients/${episode.patientId}`, { replace: true });

  return (
    <div className="page">
      <PageHeader back title={isNew ? 'New episode' : episode.title} subtitle={patientName} />
      {!isNew && <ProtocolProgress episode={initial} today={localDate(new Date())} />}
      <form
        className="card vault-form"
        onSubmit={(event) => {
          event.preventDefault();
          saveRecord('episode', { ...episode, title: episode.title.trim() });
          backToFolder();
        }}
      >
        <TextField label="Title" value={episode.title} placeholder="e.g. Right knee — ACL reconstruction" onChange={(title) => update({ title })} required />
        <div className="field-row">
          <SelectField label="Side" value={episode.side} onChange={(side) => update({ side })}>
            {(Object.keys(SIDE_LABELS) as EpisodeSide[]).map((side) => (
              <option key={side} value={side}>
                {SIDE_LABELS[side]}
              </option>
            ))}
          </SelectField>
          <SelectField label="Status" value={episode.status} onChange={(status) => update({ status })}>
            <option value="active">Active</option>
            <option value="discharged">Discharged</option>
          </SelectField>
        </div>
        <TextAreaField label="Diagnosis" rows={2} value={episode.diagnosis} onChange={(diagnosis) => update({ diagnosis })} />
        <SelectField label="Protocol (Rehab tab)" value={episode.protocolId ?? ''} onChange={(value) => update({ protocolId: value === '' ? null : value })}>
          <option value="">No protocol</option>
          {(['fracture', 'surgery'] as const).flatMap((kind) =>
            PROTOCOL_REGIONS.map((region) => {
              const options = PROTOCOLS.filter((p) => p.kind === kind && p.regionId === region.id);
              if (options.length === 0) return null;
              return (
                <optgroup key={`${kind}-${region.id}`} label={`${PROTOCOL_KIND_LABELS[kind]} — ${region.name}`}>
                  {options.map((protocol) => (
                    <option key={protocol.id} value={protocol.id}>
                      {protocol.name} — {protocol.management}
                    </option>
                  ))}
                </optgroup>
              );
            }),
          )}
        </SelectField>
        <TextField label="Surgery or injury date (week 0 of the protocol)" type="date" value={episode.startDate ?? ''} onChange={(value) => update({ startDate: value === '' ? null : value })} />
        <TextAreaField label="Notes" value={episode.notes} onChange={(notes) => update({ notes })} />
        <button type="submit" className="button button-primary" disabled={episode.title.trim() === ''}>
          {isNew ? 'Create episode' : 'Save'}
        </button>
      </form>
      {!isNew && <AttachmentsCard patientId={episode.patientId} episodeId={episode.id} />}
      {!isNew && (
        <button
          type="button"
          className="text-button danger"
          onClick={() => {
            if (!window.confirm('Delete this episode? Its sessions and files stay in the patient folder.')) return;
            deleteEpisode(episode.id);
            backToFolder();
          }}
        >
          Delete episode
        </button>
      )}
    </div>
  );
}
