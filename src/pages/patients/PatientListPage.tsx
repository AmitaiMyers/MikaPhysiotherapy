import { useState } from 'react';
import { Icon } from '../../components/Icon';
import { Link } from 'react-router';
import { PatientsTabs } from '../../components/PatientsTabs';
import { Card, PageHeader } from '../../components/ui';
import { matchesWords } from '../../domain/search';
import { backupIsDue } from '../../patients/backup';
import { localDate } from '../../patients/dates';
import { patientSummary } from '../../patients/patients';
import { useRecords, useVaultState } from '../../patients/vault';

/** Reminder banner when patient data exists and the last backup is more than a week old. */
export function BackupReminder() {
  const vault = useVaultState();
  const patients = useRecords('patient');
  if (!backupIsDue(vault.meta?.lastBackupAt ?? null, patients.length > 0, new Date())) return null;
  return (
    <p className="caution-box">
      <strong>Back up your patient data.</strong> It is stored only on this device. <Link to="/patients/settings">Download a backup</Link>
    </p>
  );
}

export function PatientListPage() {
  const patients = useRecords('patient');
  const episodes = useRecords('episode');
  const [text, setText] = useState('');
  const today = localDate(new Date());
  const results = patients
    .filter((p) => matchesWords(text, [p.firstName, p.medicalBackground, ...episodes.filter((e) => e.patientId === p.id).map((e) => `${e.title} ${e.diagnosis}`)]))
    .sort((a, b) => a.firstName.localeCompare(b.firstName));

  return (
    <div className="page">
      <PageHeader
        title="Patients"
        subtitle={`${patients.length} ${patients.length === 1 ? 'patient' : 'patients'} · encrypted on this device`}
        actions={
          <Link to="/patients/new" className="icon-button" aria-label="New patient">
            <Icon name="plus" />
          </Link>
        }
      />
      <PatientsTabs />
      <BackupReminder />
      {patients.length === 0 ? (
        <Card>
          <p>No patients yet.</p>
          <Link to="/patients/new" className="button button-primary spaced-top">
            Add the first patient
          </Link>
        </Card>
      ) : (
        <>
          <input type="search" className="search-input" placeholder="Search name, diagnosis or episode" value={text} onChange={(event) => setText(event.target.value)} aria-label="Search patients" />
          <section className="card list-card">
            <ul className="muscle-list">
              {results.map((patient) => {
                const active = episodes.filter((e) => e.patientId === patient.id && e.status === 'active');
                return (
                  <li key={patient.id}>
                    <Link to={`/patients/${patient.id}`} className="muscle-row">
                      <span className="avatar" aria-hidden="true">
                        {patient.firstName.slice(0, 1).toUpperCase()}
                      </span>
                      <span className="muscle-row-text">
                        <span className="muscle-row-name">{patient.firstName}</span>
                        <span className="muscle-row-meta">{[patientSummary(patient, today), active.map((e) => e.title).join(', ')].filter(Boolean).join(' · ') || 'No active episode'}</span>
                      </span>
                      <span className="chevron" aria-hidden="true">
                        <Icon name="chevron" size={18} />
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        </>
      )}
    </div>
  );
}
