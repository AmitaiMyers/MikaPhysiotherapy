import { useEffect, useState } from 'react';
import { PatientsTabs } from '../../components/PatientsTabs';
import { Card, Note, PageHeader } from '../../components/ui';
import { downloadBackup } from '../../patients/backupIo';
import { biometricAvailable } from '../../patients/biometric';
import { MIN_PIN_LENGTH } from '../../patients/crypto';
import { changePin, disableBiometric, enableBiometric, eraseVault, useVaultState } from '../../patients/vault';
import { RestoreBackup } from './RestoreBackup';
import { PinInput } from './VaultGate';

export function PatientSettingsPage() {
  const vault = useVaultState();
  const lastBackup = vault.meta?.lastBackupAt ?? null;
  return (
    <div className="page">
      <PageHeader title="Patients" subtitle="Security and backup" />
      <PatientsTabs />
      <Card title="Backup">
        <p>{lastBackup === null ? 'No backup made yet.' : `Last backup: ${new Date(lastBackup).toLocaleString()}.`}</p>
        <div className="button-row spaced-top">
          <button type="button" className="button button-active" onClick={() => void downloadBackup()}>
            Download backup
          </button>
          <RestoreBackup warnExisting />
        </div>
        <Note>The backup file is encrypted: keep it somewhere safe (e.g. your cloud drive). It opens only with the PIN you have now.</Note>
      </Card>
      <ChangePinCard />
      <BiometricCard enabled={vault.meta?.biometric != null} />
      <Card title="Automatic lock">
        <p>Patient data locks after 5 minutes in the background or 15 minutes without use. Use 🔒 Lock to lock it straight away.</p>
      </Card>
      <Card title="Erase">
        <button
          type="button"
          className="text-button"
          onClick={() => {
            if (!window.confirm('Permanently delete ALL patient data on this device?')) return;
            void eraseVault();
          }}
        >
          Erase all patient data on this device
        </button>
      </Card>
    </div>
  );
}

function ChangePinCard() {
  const [oldPin, setOldPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  return (
    <Card title="Change PIN">
      <form
        className="vault-form"
        onSubmit={(event) => {
          event.preventDefault();
          void changePin(oldPin, newPin).then((ok) => {
            setMessage(ok ? 'PIN changed. Make a new backup — older backups still use the old PIN.' : 'The current PIN is wrong.');
            setOldPin('');
            setNewPin('');
          });
        }}
      >
        <PinInput label="Current PIN" value={oldPin} onChange={setOldPin} />
        <PinInput label={`New PIN (at least ${MIN_PIN_LENGTH} digits)`} value={newPin} onChange={setNewPin} />
        <button type="submit" className="button" disabled={oldPin.length < MIN_PIN_LENGTH || newPin.length < MIN_PIN_LENGTH}>
          Change PIN
        </button>
        {message !== null && <p className="small">{message}</p>}
      </form>
    </Card>
  );
}

function BiometricCard({ enabled }: { enabled: boolean }) {
  const [available, setAvailable] = useState<boolean | null>(null);
  const [pin, setPin] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  useEffect(() => {
    void biometricAvailable().then(setAvailable);
  }, []);
  if (available === false) {
    return (
      <Card title="Fingerprint or face unlock">
        <p className="muted">Not available on this device or browser. Use the PIN.</p>
      </Card>
    );
  }
  return (
    <Card title="Fingerprint or face unlock">
      {enabled ? (
        <button type="button" className="button" onClick={() => void disableBiometric()}>
          Turn off fingerprint or face unlock
        </button>
      ) : (
        <form
          className="vault-form"
          onSubmit={(event) => {
            event.preventDefault();
            setMessage(null);
            enableBiometric(pin)
              .then((ok) => setMessage(ok ? 'Fingerprint or face unlock is on.' : 'The PIN is wrong.'))
              .catch((reason: unknown) => setMessage(reason instanceof Error ? reason.message : 'Set-up failed.'))
              .finally(() => setPin(''));
          }}
        >
          <PinInput label="Confirm with your PIN" value={pin} onChange={setPin} />
          <button type="submit" className="button" disabled={pin.length < MIN_PIN_LENGTH}>
            Turn on
          </button>
        </form>
      )}
      {message !== null && <p className="small">{message}</p>}
      <Note>Needs a device whose screen lock supports passkeys (recent Android or iPhone). The PIN keeps working.</Note>
    </Card>
  );
}
