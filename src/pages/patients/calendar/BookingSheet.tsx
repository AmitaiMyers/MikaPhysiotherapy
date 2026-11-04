import { useState } from 'react';
import { Link } from 'react-router';
import { SelectField, TextField } from '../../../components/forms';
import { Modal } from '../../../components/Modal';
import { buildSessions, startingContent, type SessionStart } from '../../../patients/booking';
import { recurringDates, weekdayIndex } from '../../../patients/calendar';
import { localDate } from '../../../patients/dates';
import { lastCompletedSession } from '../../../patients/sessions';
import { useSettings } from '../../../patients/settings';
import { saveRecord, useRecords } from '../../../patients/vault';

const WEEKDAY_LABELS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

/** Book one or more planned sessions for a patient at a date and time. */
export function BookingSheet({ date, startTime, onClose }: { date: string; startTime: string; onClose: () => void }) {
  const settings = useSettings();
  const patients = [...useRecords('patient')].sort((a, b) => a.firstName.localeCompare(b.firstName));
  const episodes = useRecords('episode');
  const sessions = useRecords('session');
  const templates = useRecords('template');
  const [patientId, setPatientId] = useState(patients[0]?.id ?? '');
  const patientEpisodes = episodes.filter((e) => e.patientId === patientId);
  const [episodeId, setEpisodeId] = useState<string | null>(null);
  // Until Mika picks one, use the patient's active episode.
  const episode = episodeId ?? patientEpisodes.find((e) => e.status === 'active')?.id ?? '';
  const [day, setDay] = useState(date);
  const [time, setTime] = useState(startTime);
  const [duration, setDuration] = useState(String(settings.defaultDurationMin));
  const [start, setStart] = useState('last');
  const [repeat, setRepeat] = useState(false);
  const [weekdays, setWeekdays] = useState<number[]>([weekdayIndex(date)]);
  const [weeks, setWeeks] = useState('6');

  if (patients.length === 0) {
    return (
      <Modal title="Book a session" onClose={onClose}>
        <p>Add a patient first.</p>
        <Link to="/patients/new" className="button button-primary spaced-top">
          New patient
        </Link>
      </Modal>
    );
  }

  const episodeValue = episode === '' ? null : episode;
  const hasLast = lastCompletedSession(sessions, patientId, episodeValue) !== null;
  const startChoice = start === 'last' && !hasLast ? 'blank' : start;
  const dates = repeat ? recurringDates(day, weekdays, Number(weeks)) : [day];
  const book = () => {
    const sessionStart: SessionStart =
      startChoice === 'last' ? { kind: 'last' } : startChoice.startsWith('template:') ? { kind: 'template', templateId: startChoice.slice('template:'.length) } : { kind: 'blank' };
    const content = startingContent(sessionStart, sessions, templates, patientId, episodeValue);
    for (const session of buildSessions({ patientId, episodeId: episodeValue, dates, startTime: time, durationMin: Number(duration), content, today: localDate(new Date()) })) {
      saveRecord('session', session);
    }
    onClose();
  };

  return (
    <Modal title="Book a session" onClose={onClose}>
      <form
        className="vault-form"
        onSubmit={(event) => {
          event.preventDefault();
          book();
        }}
      >
        <SelectField
          label="Patient"
          value={patientId}
          onChange={(value) => {
            setPatientId(value);
            setEpisodeId(null);
          }}
        >
          {patients.map((patient) => (
            <option key={patient.id} value={patient.id}>
              {patient.firstName}
            </option>
          ))}
        </SelectField>
        <SelectField label="Episode" value={episode} onChange={setEpisodeId}>
          <option value="">No episode</option>
          {patientEpisodes.map((e) => (
            <option key={e.id} value={e.id}>
              {e.title}
            </option>
          ))}
        </SelectField>
        <div className="field-row">
          <TextField label="Date" type="date" value={day} onChange={setDay} required />
          <TextField label="Time" type="time" value={time} onChange={setTime} required />
        </div>
        <SelectField label="Length" value={duration} onChange={setDuration}>
          <option value="30">30 minutes</option>
          <option value="60">1 hour</option>
        </SelectField>
        <SelectField label="Prepare from" value={startChoice} onChange={setStart}>
          {hasLast && <option value="last">Repeat last session</option>}
          <option value="blank">Blank session</option>
          {templates.map((template) => (
            <option key={template.id} value={`template:${template.id}`}>
              Template: {template.name}
            </option>
          ))}
        </SelectField>
        <label className="toggle">
          <input type="checkbox" checked={repeat} onChange={(event) => setRepeat(event.target.checked)} /> Repeat weekly
        </label>
        {repeat && (
          <>
            <div className="chips" role="group" aria-label="Weekdays">
              {WEEKDAY_LABELS.map((label, index) => (
                <button
                  key={label}
                  type="button"
                  className={`toggle-chip ${weekdays.includes(index) ? 'toggle-chip-on' : ''}`}
                  aria-pressed={weekdays.includes(index)}
                  onClick={() => setWeekdays((current) => (current.includes(index) ? current.filter((d) => d !== index) : [...current, index]))}
                >
                  {label}
                </button>
              ))}
            </div>
            <SelectField label="For" value={weeks} onChange={setWeeks}>
              {[2, 3, 4, 6, 8, 10, 12].map((n) => (
                <option key={n} value={String(n)}>
                  {n} weeks
                </option>
              ))}
            </SelectField>
          </>
        )}
        <button type="submit" className="button button-primary">
          Book {dates.length} {dates.length === 1 ? 'session' : 'sessions'}
        </button>
      </form>
    </Modal>
  );
}
