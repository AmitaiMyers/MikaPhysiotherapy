import { useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { TextField } from '../../../components/forms';
import { Card, Note, PageHeader } from '../../../components/ui';
import { buildSessions } from '../../../patients/booking';
import { addDays, formatDate, localDate } from '../../../patients/dates';
import { eventKey, matchPatient, readCalendar, type CalendarEvent } from '../../../patients/ics';
import { emptyPatient } from '../../../patients/records';
import { emptyContent } from '../../../patients/sessions';
import { calendarTexts } from '../../../patients/zip';
import { saveRecord, useRecords } from '../../../patients/vault';

const SKIP = 'skip';
const NEW = 'new';

/** Events with the same title usually belong to the same patient, so Mika chooses once per title. */
function groupByTitle(events: CalendarEvent[]): Map<string, CalendarEvent[]> {
  const groups = new Map<string, CalendarEvent[]>();
  for (const event of events) groups.set(event.summary, [...(groups.get(event.summary) ?? []), event]);
  return groups;
}

const firstWord = (title: string) => title.split(/[^\p{L}\p{N}'-]+/u).find(Boolean) ?? title;

export function CalendarImportPage() {
  const navigate = useNavigate();
  const today = localDate(new Date());
  const patients = useRecords('patient');
  const sessions = useRecords('session');
  const input = useRef<HTMLInputElement>(null);
  const [from, setFrom] = useState(today);
  const [to, setTo] = useState(addDays(today, 182));
  const [texts, setTexts] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [choices, setChoices] = useState<Record<string, string>>({});

  const imported = new Set(sessions.map((s) => s.externalId).filter((id) => id !== undefined));
  const events = texts === null ? [] : texts.flatMap((text) => readCalendar(text, from, to)).filter((event) => !imported.has(eventKey(event)));
  const groups = [...groupByTitle(events).entries()];
  const choiceFor = (title: string) => choices[title] ?? matchPatient(title, patients)?.id ?? SKIP;
  const toImport = groups.filter(([title]) => choiceFor(title) !== SKIP).reduce((sum, [, list]) => sum + list.length, 0);

  const runImport = () => {
    for (const [title, list] of groups) {
      const choice = choiceFor(title);
      if (choice === SKIP) continue;
      let patientId = choice;
      if (choice === NEW) {
        const patient = { ...emptyPatient(today), firstName: firstWord(title) };
        saveRecord('patient', patient);
        patientId = patient.id;
      }
      for (const event of list) {
        const [session] = buildSessions({ patientId, episodeId: null, dates: [event.date], startTime: event.startTime, durationMin: event.durationMin, content: emptyContent(), today, externalId: eventKey(event) });
        if (session === undefined) throw new Error('No session was built');
        saveRecord('session', session);
      }
    }
    void navigate('/patients/calendar', { replace: true });
  };

  return (
    <div className="page">
      <PageHeader back title="Import from Google Calendar" />
      <Card title="1. Export your calendar">
        <ol className="steps small">
          <li>On a computer, open Google Calendar → Settings (⚙) → Import & export → Export.</li>
          <li>Google downloads a .zip file with your calendars (.ics). Send it to this device, or open the app on that computer.</li>
          <li>Choose the file below — the .zip or a single .ics both work.</li>
        </ol>
      </Card>
      <Card title="2. Choose the file and the dates">
        <div className="field-row">
          <TextField label="From" type="date" value={from} onChange={setFrom} />
          <TextField label="To" type="date" value={to} onChange={setTo} />
        </div>
        <button type="button" className="button button-active spaced-top" onClick={() => input.current?.click()}>
          {texts === null ? 'Choose calendar file' : 'Choose another file'}
        </button>
        <input
          ref={input}
          type="file"
          accept=".ics,.zip,text/calendar,application/zip"
          hidden
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = '';
            if (file === undefined) return;
            setError(null);
            calendarTexts(file)
              .then(setTexts)
              .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : 'The file could not be read.'));
          }}
        />
        {error !== null && <p className="field-error">{error}</p>}
        <Note>Only timed appointments are read; all-day and cancelled events are skipped, and appointments already imported are not imported again.</Note>
      </Card>
      {texts !== null && (
        <Card title={`3. Match appointments to patients (${events.length} found)`}>
          {groups.length === 0 && <p className="muted">No new appointments in these dates.</p>}
          <ul className="import-list">
            {groups.map(([title, list]) => (
              <li key={title}>
                <span>
                  <strong>{title || '(no title)'}</strong>
                  <br />
                  <span className="muted small">
                    {list.length} × · next {formatDate(list[0]?.date ?? today)} {list[0]?.startTime}
                  </span>
                </span>
                <select aria-label={`Patient for ${title}`} value={choiceFor(title)} onChange={(event) => setChoices((current) => ({ ...current, [title]: event.target.value }))}>
                  <option value={SKIP}>Skip</option>
                  <option value={NEW}>New patient “{firstWord(title)}”</option>
                  {patients.map((patient) => (
                    <option key={patient.id} value={patient.id}>
                      {patient.firstName}
                    </option>
                  ))}
                </select>
              </li>
            ))}
          </ul>
          <button type="button" className="button button-active spaced-top" disabled={toImport === 0} onClick={runImport}>
            Import {toImport} {toImport === 1 ? 'appointment' : 'appointments'}
          </button>
        </Card>
      )}
    </div>
  );
}
