import { useState } from 'react';
import { Link } from 'react-router';
import { ActionButton } from '../../components/feedback';
import { Modal } from '../../components/Modal';
import { shareOrDownloadFile } from '../../domain/share';
import { formatDate, localDate } from '../../patients/dates';
import { nowIso } from '../../patients/records';
import type { Episode, Session } from '../../patients/types';
import { saveRecord, useRecords, useVaultState } from '../../patients/vault';
import { setAuthorName, useAuthorName } from '../../techniques/author';
import { exportTechniques } from '../../techniques/exchangeIo';
import { useTechniqueContent } from '../../techniques/store';
import { Icon } from '../../components/Icon';

/** Export a technique (with Mika's notes) as a file other physiotherapists can import. */
export function ShareTechniqueCard({ techniqueId, name, hasOwnMedia }: { techniqueId: string; name: string; hasOwnMedia: boolean }) {
  const author = useAuthorName();
  const { notes } = useTechniqueContent();
  const [includeMedia, setIncludeMedia] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const noteCount = notes.filter((n) => n.techniqueId === techniqueId).length;
  const share = async () => {
    setStatus(null);
    const file = await exportTechniques([techniqueId], includeMedia);
    const result = await shareOrDownloadFile(file, name);
    if (result === 'downloaded') setStatus(`Saved ${file.name} — send it to a colleague to import.`);
  };
  return (
    <section className="card">
      <h2>Share with physiotherapists</h2>
      <p className="small">
        Sends a technique file they can import in this app{noteCount > 0 ? `, with your ${noteCount} ${noteCount === 1 ? 'note' : 'notes and variations'}` : ''}.
      </p>
      {hasOwnMedia && (
        <label className="toggle">
          <input type="checkbox" checked={includeMedia} onChange={(event) => setIncludeMedia(event.target.checked)} /> Include my photos and videos (larger file)
        </label>
      )}
      <label className="field">
        <span>Shared as</span>
        <input className="search-input" defaultValue={author} onBlur={(event) => setAuthorName(event.target.value)} aria-label="Your name on shared files" />
      </label>
      <ActionButton onRun={share} done="Exported" icon="share">
        Export & share
      </ActionButton>
      {status !== null && <p className="muted small">{status}</p>}
    </section>
  );
}

/** Sessions worth offering: upcoming planned ones, then the most recent ones. */
function candidateSessions(sessions: Session[], patientId: string, today: string): Session[] {
  const own = sessions.filter((s) => s.patientId === patientId);
  const upcoming = own.filter((s) => s.date >= today).sort((a, b) => `${a.date}${a.startTime}`.localeCompare(`${b.date}${b.startTime}`));
  const recent = own.filter((s) => s.date < today).sort((a, b) => `${b.date}${b.startTime}`.localeCompare(`${a.date}${a.startTime}`));
  return [...upcoming.slice(0, 4), ...recent.slice(0, 3)];
}

/** Add a technique to a patient's session or to an episode's care plan. */
export function AddToPatientButton({ techniqueId, name }: { techniqueId: string; name: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className="button button-primary" onClick={() => setOpen(true)}>
        <Icon name="plus" size={18} /> Add to a patient
      </button>
      {open && <AddToPatientSheet techniqueId={techniqueId} name={name} onClose={() => setOpen(false)} />}
    </>
  );
}

function AddToPatientSheet({ techniqueId, name, onClose }: { techniqueId: string; name: string; onClose: () => void }) {
  const vault = useVaultState();
  if (vault.status !== 'unlocked') {
    return (
      <Modal title="Add to a patient" onClose={onClose}>
        <p>Patient data is locked. Unlock it, then come back to this technique.</p>
        <Link to="/patients" className="button button-primary spaced-top">
          Unlock patients
        </Link>
      </Modal>
    );
  }
  return <PatientChooser techniqueId={techniqueId} name={name} onClose={onClose} />;
}

function PatientChooser({ techniqueId, name, onClose }: { techniqueId: string; name: string; onClose: () => void }) {
  const patients = [...useRecords('patient')].sort((a, b) => a.firstName.localeCompare(b.firstName));
  const sessions = useRecords('session');
  const episodes = useRecords('episode');
  const [patientId, setPatientId] = useState(patients[0]?.id ?? '');
  const [done, setDone] = useState<{ label: string; to: string } | null>(null);
  const today = localDate(new Date());

  if (patients.length === 0) {
    return (
      <Modal title="Add to a patient" onClose={onClose}>
        <p>No patients yet.</p>
      </Modal>
    );
  }

  const addToSession = (session: Session) => {
    const side = episodes.find((e) => e.id === session.episodeId)?.side ?? 'none';
    saveRecord('session', { ...session, techniques: [...session.techniques, { techniqueId, side, values: {}, response: '', adverseEvent: '' }], updatedAt: nowIso() });
    setDone({ label: `Added to the session on ${formatDate(session.date)}.`, to: `/patients/sessions/${session.id}` });
  };
  const addToPlan = (episode: Episode) => {
    saveRecord('episode', { ...episode, plannedTechniques: [...episode.plannedTechniques, { techniqueId, note: '' }] });
    setDone({ label: `Added to the care plan of ${episode.title}; new sessions in this episode will include it.`, to: `/patients/${episode.patientId}/episodes/${episode.id}` });
  };
  const offered = candidateSessions(sessions, patientId, today);
  const activeEpisodes = episodes.filter((e) => e.patientId === patientId && e.status === 'active');

  return (
    <Modal title={`Add “${name}”`} onClose={onClose}>
      {done !== null ? (
        <>
          <p>{done.label}</p>
          <div className="button-row spaced-top">
            <Link to={done.to} className="button button-primary">
              Open
            </Link>
            <button type="button" className="button" onClick={() => setDone(null)}>
              Add to another
            </button>
          </div>
        </>
      ) : (
        <>
          <label className="field">
            <span>Patient</span>
            <select value={patientId} onChange={(event) => setPatientId(event.target.value)}>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.firstName}
                </option>
              ))}
            </select>
          </label>
          <h3 className="subheading">Session</h3>
          {offered.length === 0 && <p className="muted small">No sessions for this patient yet.</p>}
          <ul className="link-list">
            {offered.map((session) => {
              const already = session.techniques.some((t) => t.techniqueId === techniqueId);
              return (
                <li key={session.id} className="assign-row">
                  <span>
                    {formatDate(session.date)} {session.startTime} <span className="muted small">· {session.status === 'done' ? 'done' : 'planned'}</span>
                  </span>
                  <button type="button" className="button" disabled={already} onClick={() => addToSession(session)}>
                    {already ? 'Added' : 'Add'}
                  </button>
                </li>
              );
            })}
          </ul>
          <h3 className="subheading">Care plan</h3>
          {activeEpisodes.length === 0 && <p className="muted small">No active episode for this patient.</p>}
          <ul className="link-list">
            {activeEpisodes.map((episode) => {
              const already = episode.plannedTechniques.some((t) => t.techniqueId === techniqueId);
              return (
                <li key={episode.id} className="assign-row">
                  <span>{episode.title}</span>
                  <button type="button" className="button" disabled={already} onClick={() => addToPlan(episode)}>
                    {already ? 'In plan' : 'Add to plan'}
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </Modal>
  );
}
