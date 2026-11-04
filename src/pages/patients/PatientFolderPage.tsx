import { Link, useNavigate, useParams } from 'react-router';
import { Card, Empty, PageHeader } from '../../components/ui';
import { localDate } from '../../patients/dates';
import { patientSummary } from '../../patients/patients';
import { deletePatientAndRecords } from '../../patients/records';
import type { Patient } from '../../patients/types';
import { getRecord, useRecords } from '../../patients/vault';
import { AttachmentsCard } from './AttachmentsCard';
import { ProtocolProgress, SIDE_LABELS } from './EpisodeSummary';
import { SessionList } from './SessionList';

export function PatientFolderPage() {
  const { id = '' } = useParams();
  useRecords('patient');
  const patient = getRecord('patient', id);
  if (patient === undefined) return <Empty>Patient not found.</Empty>;
  return <PatientFolder patient={patient} />;
}

function PatientFolder({ patient }: { patient: Patient }) {
  const navigate = useNavigate();
  const today = localDate(new Date());
  const sessions = useRecords('session').filter((s) => s.patientId === patient.id);
  const episodes = useRecords('episode')
    .filter((e) => e.patientId === patient.id)
    .sort((a, b) => (a.status === b.status ? b.createdAt.localeCompare(a.createdAt) : a.status === 'active' ? -1 : 1));

  return (
    <div className="page">
      <PageHeader
        back
        title={patient.firstName}
        subtitle={patientSummary(patient, today) || undefined}
        actions={
          <Link to={`/patients/${patient.id}/edit`} className="icon-button" aria-label="Edit patient">
            ✎
          </Link>
        }
      />
      <Card title="Medical background">
        <p className="pre-line">{patient.medicalBackground || '—'}</p>
      </Card>
      <Card title="Lifestyle">
        <p className="pre-line">{patient.lifestyle || '—'}</p>
      </Card>

      <div className="section-title-row">
        <h2 className="section-heading">Episodes</h2>
        <Link to={`/patients/${patient.id}/episodes/new`} className="button">
          ＋ New episode
        </Link>
      </div>
      {episodes.length === 0 && <Empty>No episodes yet — add one for each problem you treat (e.g. “Right knee — ACL reconstruction”).</Empty>}
      {episodes.map((episode) => (
        <Link key={episode.id} to={`/patients/${patient.id}/episodes/${episode.id}`} className="card episode-card">
          <span className="episode-title">
            {episode.title}
            <span className={`status-tag status-${episode.status}`}>{episode.status === 'active' ? 'Active' : 'Discharged'}</span>
          </span>
          <span className="muted small">{[episode.side === 'none' ? null : SIDE_LABELS[episode.side], episode.diagnosis].filter(Boolean).join(' · ')}</span>
          <ProtocolProgress episode={episode} today={today} />
        </Link>
      ))}

      <div className="section-title-row">
        <h2 className="section-heading">Sessions</h2>
        <Link to={`/patients/${patient.id}/sessions/new`} className="button button-active">
          ＋ New session
        </Link>
      </div>
      <SessionList sessions={sessions} episodes={episodes} />

      <AttachmentsCard patientId={patient.id} episodeId={null} />

      <button
        type="button"
        className="text-button"
        onClick={() => {
          if (!window.confirm(`Delete ${patient.firstName} with all episodes, sessions and files? This cannot be undone.`)) return;
          deletePatientAndRecords(patient.id);
          void navigate('/patients', { replace: true });
        }}
      >
        Delete patient
      </button>
    </div>
  );
}
