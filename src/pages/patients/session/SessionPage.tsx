import { Link, useNavigate, useParams } from 'react-router';
import { SelectField, TextAreaField, TextField } from '../../../components/forms';
import { Empty, PageHeader } from '../../../components/ui';
import { getProtocol } from '../../../data/protocols';
import { protocolPosition } from '../../../data/protocols/timing';
import { daysBetween, formatDate } from '../../../patients/dates';
import { newId, nowIso } from '../../../patients/records';
import { contentOf, scoreSubjects } from '../../../patients/sessions';
import type { Episode, Session, Side } from '../../../patients/types';
import { deleteRecord, getRecord, saveRecord, useRecords } from '../../../patients/vault';
import { ExercisesSection } from './ExercisesSection';
import { ObjectiveSections } from './ObjectiveSections';
import { HomeProgrammeSection, ProtocolSection, ScoresSection, SubjectiveSection, TreatmentSection } from './OtherSections';
import { SessionSection } from './SessionSection';
import { TechniquesSection } from './TechniquesSection';
import { buzz, promptText, showToast, toastWithUndo } from '../../../feedback/store';

export function SessionPage() {
  const { sessionId = '' } = useParams();
  const sessions = useRecords('session');
  const session = sessions.find((s) => s.id === sessionId);
  if (session === undefined) return <Empty>Session not found.</Empty>;
  return <SessionEditor session={session} allSessions={sessions} />;
}

const SOAP_JUMPS = [
  ['S', 'soap-s', 'Subjective'],
  ['O', 'soap-o', 'Objective'],
  ['T', 'soap-t', 'Treatment and exercises'],
  ['A', 'soap-a', 'Assessment'],
  ['P', 'soap-p', 'Plan'],
] as const;

function jumpTo(id: string): void {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function suggestedPhase(episode: Episode | undefined, date: string): number | null {
  if (episode?.protocolId == null || episode.startDate === null) return null;
  const days = daysBetween(episode.startDate, date);
  return days < 0 ? null : protocolPosition(getProtocol(episode.protocolId), days).phaseIndex;
}

function SessionEditor({ session, allSessions }: { session: Session; allSessions: Session[] }) {
  const navigate = useNavigate();
  const patient = getRecord('patient', session.patientId);
  const episodes = useRecords('episode').filter((e) => e.patientId === session.patientId);
  const episode = episodes.find((e) => e.id === session.episodeId);
  // Every change is saved (encrypted) straight away.
  const update = (patch: Partial<Session>) => saveRecord('session', { ...session, ...patch, updatedAt: nowIso() });
  const defaultSide: Side = episode?.side === 'left' ? 'left' : 'right';
  const protocol = episode?.protocolId == null ? null : getProtocol(episode.protocolId);

  return (
    <div className="page">
      <PageHeader
        back
        title={patient === undefined ? 'Session' : <Link to={`/patients/${patient.id}`}>{patient.firstName}</Link>}
        subtitle={`${formatDate(session.date)} · ${session.startTime} · ${session.durationMin} min`}
      />
      <div className="segmented status-toggle" role="group" aria-label="Status">
        {(['planned', 'done'] as const).map((status) => (
          <button key={status} type="button" className={session.status === status ? 'segment-active' : ''} aria-pressed={session.status === status} onClick={() => update({ status })}>
            {status === 'planned' ? 'Planned' : 'Done'}
          </button>
        ))}
      </div>
      <nav className="soap-bar" aria-label="Jump to section">
        {SOAP_JUMPS.map(([letter, target, label]) => (
          <button key={target} type="button" className="soap-chip" aria-label={label} onClick={() => jumpTo(target)}>
            {letter}
          </button>
        ))}
      </nav>
      <SessionSection title="Date, time & episode">
        <div className="field-row">
          <TextField label="Date" type="date" value={session.date} onChange={(date) => update({ date })} />
          <TextField label="Time" type="time" value={session.startTime} onChange={(startTime) => update({ startTime })} />
        </div>
        <div className="field-row">
          <SelectField label="Length" value={String(session.durationMin)} onChange={(value) => update({ durationMin: Number(value) })}>
            <option value="30">30 minutes</option>
            <option value="60">1 hour</option>
          </SelectField>
          <SelectField label="Episode" value={session.episodeId ?? ''} onChange={(value) => update({ episodeId: value === '' ? null : value })}>
            <option value="">No episode</option>
            {episodes.map((e) => (
              <option key={e.id} value={e.id}>
                {e.title}
              </option>
            ))}
          </SelectField>
        </div>
      </SessionSection>

      <span id="soap-s" className="soap-anchor" />
      <SubjectiveSection subjective={session.subjective} onChange={(subjective) => update({ subjective })} />
      <h2 className="section-heading soap-heading" id="soap-o">
        <span className="soap-letter">O</span> Objective
      </h2>
      <ObjectiveSections objective={session.objective} defaultSide={defaultSide} onChange={(objective) => update({ objective })} />
      <h2 className="section-heading soap-heading" id="soap-t">
        <span className="soap-letter">T</span> Treatment
      </h2>
      <TreatmentSection treatment={session.treatment} onChange={(treatment) => update({ treatment })} />
      <TechniquesSection techniques={session.techniques} plan={episode?.plannedTechniques ?? []} defaultSide={episode?.side ?? 'none'} onChange={(techniques) => update({ techniques })} />
      <ExercisesSection exercises={session.exercises} onChange={(exercises) => update({ exercises })} />
      {protocol !== null && <ProtocolSection protocol={protocol} value={session.protocol} suggestedPhase={suggestedPhase(episode, session.date)} onChange={(value) => update({ protocol: value })} />}
      <HomeProgrammeSection value={session.homeProgramme} exercises={session.exercises} onChange={(homeProgramme) => update({ homeProgramme })} />
      <ScoresSection scores={session.scores} subjects={scoreSubjects(allSessions, session.patientId)} onChange={(scores) => update({ scores })} />
      <span id="soap-a" className="soap-anchor" />
      <SessionSection letter="A" title="Assessment" defaultOpen count={session.assessment === '' ? 0 : 1}>
        <TextAreaField label="Clinical reasoning, progress, response to treatment" rows={4} value={session.assessment} onChange={(assessment) => update({ assessment })} />
      </SessionSection>
      <span id="soap-p" className="soap-anchor" />
      <SessionSection letter="P" title="Plan" defaultOpen count={session.plan === '' ? 0 : 1}>
        <TextAreaField label="Plan for next session" rows={4} value={session.plan} onChange={(plan) => update({ plan })} />
        <TextAreaField label="Other notes" value={session.notes} onChange={(notes) => update({ notes })} />
      </SessionSection>

      <p className="muted small center">Saved automatically and encrypted.</p>
      <div className="button-row">
        <button
          type="button"
          className="button"
          onClick={() => {
            void promptText({ title: 'Save as template', label: 'Template name', initial: episode?.title ?? 'Session template', confirmLabel: 'Save template' }).then((name) => {
              if (name === null) return;
              saveRecord('template', { id: newId(), name, content: contentOf(session), createdAt: nowIso() });
              showToast(`Template “${name}” saved`);
            });
          }}
        >
          Save as template
        </button>
        <Link to={`/patients/${session.patientId}/sessions/new?episode=${session.episodeId ?? ''}`} className="button">
          Plan next session
        </Link>
        <button
          type="button"
          className="text-button danger"
          onClick={() => {
            buzz();
            deleteRecord('session', session.id);
            toastWithUndo('Session deleted', () => saveRecord('session', session));
            void navigate(`/patients/${session.patientId}`, { replace: true });
          }}
        >
          Delete session
        </button>
      </div>
    </div>
  );
}
