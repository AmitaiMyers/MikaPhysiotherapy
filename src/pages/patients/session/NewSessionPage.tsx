import { useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router';
import { SelectField, TextField } from '../../../components/forms';
import { Empty, PageHeader } from '../../../components/ui';
import { formatDate, localDate } from '../../../patients/dates';
import { newId, nowIso } from '../../../patients/records';
import { contentOf, emptyContent, lastCompletedSession, sessionStructure } from '../../../patients/sessions';
import { useSettings } from '../../../patients/settings';
import type { Session } from '../../../patients/types';
import { getRecord, saveRecord, useRecords } from '../../../patients/vault';

const nextHour = (): string => `${String(Math.min(new Date().getHours() + 1, 23)).padStart(2, '0')}:00`;

/** Choose the episode, time and starting point (blank, repeat last session, or a template). */
export function NewSessionPage() {
  const { id = '' } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const settings = useSettings();
  const patient = getRecord('patient', id);
  const episodes = useRecords('episode').filter((e) => e.patientId === id);
  const sessions = useRecords('session');
  const templates = useRecords('template');
  const active = episodes.filter((e) => e.status === 'active');
  const [episodeId, setEpisodeId] = useState(params.get('episode') ?? active[0]?.id ?? '');
  const [date, setDate] = useState(params.get('date') ?? localDate(new Date()));
  const [startTime, setStartTime] = useState(params.get('time') ?? nextHour());
  const [durationMin, setDurationMin] = useState(String(settings.defaultDurationMin));
  const last = lastCompletedSession(sessions, id, episodeId === '' ? null : episodeId);
  const [start, setStart] = useState(last === null ? 'blank' : 'last');
  if (patient === undefined) return <Empty>Patient not found.</Empty>;

  const create = () => {
    const template = templates.find((t) => `template:${t.id}` === start);
    const content = start === 'last' && last !== null ? sessionStructure(contentOf(last)) : template !== undefined ? sessionStructure(template.content) : emptyContent();
    const session: Session = {
      id: newId(),
      patientId: patient.id,
      episodeId: episodeId === '' ? null : episodeId,
      status: date > localDate(new Date()) ? 'planned' : 'done',
      date,
      startTime,
      durationMin: Number(durationMin),
      seriesId: null,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      ...content,
    };
    saveRecord('session', session);
    void navigate(`/patients/sessions/${session.id}`, { replace: true });
  };

  return (
    <div className="page">
      <PageHeader back title="New session" subtitle={patient.firstName} />
      <form
        className="card vault-form"
        onSubmit={(event) => {
          event.preventDefault();
          create();
        }}
      >
        <SelectField label="Episode" value={episodeId} onChange={setEpisodeId}>
          <option value="">No episode</option>
          {episodes.map((episode) => (
            <option key={episode.id} value={episode.id}>
              {episode.title}
              {episode.status === 'discharged' ? ' (discharged)' : ''}
            </option>
          ))}
        </SelectField>
        <div className="field-row">
          <TextField label="Date" type="date" value={date} onChange={setDate} required />
          <TextField label="Time" type="time" value={startTime} onChange={setStartTime} required />
        </div>
        <SelectField label="Length" value={durationMin} onChange={setDurationMin}>
          <option value="30">30 minutes</option>
          <option value="60">1 hour</option>
        </SelectField>
        <fieldset className="choice-list">
          <legend>Start from</legend>
          <label>
            <input type="radio" name="start" checked={start === 'blank'} onChange={() => setStart('blank')} /> Blank session
          </label>
          <label className={last === null ? 'muted' : ''}>
            <input type="radio" name="start" disabled={last === null} checked={start === 'last'} onChange={() => setStart('last')} /> Repeat last session
            {last !== null && <span className="small"> ({formatDate(last.date)})</span>}
          </label>
          {templates.map((template) => (
            <label key={template.id}>
              <input type="radio" name="start" checked={start === `template:${template.id}`} onChange={() => setStart(`template:${template.id}`)} /> Template: {template.name}
            </label>
          ))}
        </fieldset>
        <button type="submit" className="button button-active">
          Create session
        </button>
      </form>
    </div>
  );
}
