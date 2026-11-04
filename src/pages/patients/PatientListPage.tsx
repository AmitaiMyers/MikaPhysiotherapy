import { PatientsTabs } from '../../components/PatientsTabs';
import { Card, PageHeader } from '../../components/ui';
import { backupIsDue } from '../../patients/backup';
import { useRecords, useVaultState } from '../../patients/vault';
import { Link } from 'react-router';

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
  return (
    <div className="page">
      <PageHeader title="Patients" subtitle="Stored encrypted on this device" />
      <PatientsTabs />
      <BackupReminder />
      <Card>
        <p className="muted">No patients yet.</p>
      </Card>
    </div>
  );
}
