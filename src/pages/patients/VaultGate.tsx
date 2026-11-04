import { useEffect, useState, type ReactNode } from 'react';
import { Card, Note, PageHeader } from '../../components/ui';
import { RestoreBackup } from './RestoreBackup';
import { biometricAvailable } from '../../patients/biometric';
import { MIN_PIN_LENGTH } from '../../patients/crypto';
import { createVault, eraseVault, unlockWithBiometric, unlockWithPin, useVaultState } from '../../patients/vault';

/** Shows the set-up or unlock screen until the vault is open, then the patients screens. */
export function VaultGate({ children }: { children: ReactNode }) {
  const vault = useVaultState();
  if (vault.status === 'loading') return <p className="muted center">Opening…</p>;
  if (vault.status === 'empty') return <SetupScreen />;
  if (vault.status === 'locked') return <UnlockScreen hasBiometric={vault.meta?.biometric != null} />;
  return (
    <>
      {vault.storageError !== null && <p className="error-banner">Saving failed: {vault.storageError}. Make a backup and reload the app.</p>}
      {children}
    </>
  );
}

const pinValid = (pin: string) => /^\d+$/.test(pin) && pin.length >= MIN_PIN_LENGTH;

export function PinInput({ label, value, onChange, autoFocus = false }: { label: string; value: string; onChange: (pin: string) => void; autoFocus?: boolean }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input
        className="search-input pin-input"
        type="password"
        inputMode="numeric"
        autoComplete="off"
        value={value}
        onChange={(event) => onChange(event.target.value.replace(/\D/g, ''))}
        autoFocus={autoFocus}
      />
    </label>
  );
}

function SetupScreen() {
  const [pin, setPin] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const mismatch = confirm !== '' && confirm !== pin;
  return (
    <div className="page">
      <PageHeader title="Patients" subtitle="Set up a PIN to protect patient data" />
      <form
        className="card vault-form"
        onSubmit={(event) => {
          event.preventDefault();
          setBusy(true);
          void createVault(pin);
        }}
      >
        <p>Patient records are stored only on this device and are encrypted with your PIN.</p>
        <PinInput label={`New PIN (at least ${MIN_PIN_LENGTH} digits)`} value={pin} onChange={setPin} autoFocus />
        <PinInput label="Repeat the PIN" value={confirm} onChange={setConfirm} />
        {mismatch && <p className="field-error">The PINs do not match.</p>}
        <button type="submit" className="button button-primary" disabled={busy || !pinValid(pin) || pin !== confirm}>
          {busy ? 'Setting up…' : 'Create PIN'}
        </button>
        <Note>There is no way to recover a forgotten PIN — the data cannot be decrypted without it. Make regular backups (Settings).</Note>
      </form>
      <Card title="Moving from another device?">
        <RestoreBackup warnExisting={false} />
      </Card>
    </div>
  );
}

function UnlockScreen({ hasBiometric }: { hasBiometric: boolean }) {
  const [pin, setPin] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [canBiometric, setCanBiometric] = useState(false);

  useEffect(() => {
    if (hasBiometric) void biometricAvailable().then(setCanBiometric);
  }, [hasBiometric]);

  const tryBiometric = () => {
    setError(null);
    unlockWithBiometric().catch((reason: unknown) => setError(reason instanceof Error ? reason.message : 'Biometric unlock failed.'));
  };

  return (
    <div className="page">
      <PageHeader title="Patients" subtitle="Locked" />
      <form
        className="card vault-form"
        onSubmit={(event) => {
          event.preventDefault();
          setBusy(true);
          setError(null);
          void unlockWithPin(pin).then((ok) => {
            setBusy(false);
            if (!ok) {
              setPin('');
              setError('Wrong PIN.');
            }
          });
        }}
      >
        <PinInput label="PIN" value={pin} onChange={setPin} autoFocus />
        {error !== null && <p className="field-error">{error}</p>}
        <button type="submit" className="button button-primary" disabled={busy || pin.length < MIN_PIN_LENGTH}>
          {busy ? 'Unlocking…' : 'Unlock'}
        </button>
        {canBiometric && (
          <button type="button" className="button" onClick={tryBiometric}>
            Unlock with fingerprint or face
          </button>
        )}
      </form>
      <ForgotPin />
    </div>
  );
}

function ForgotPin() {
  return (
    <button
      type="button"
      className="text-button danger small"
      onClick={() => {
        if (!window.confirm('Forgot the PIN? The data cannot be recovered without it. Erase all patient data on this device and start again (you can then restore a backup)?')) return;
        if (!window.confirm('This permanently deletes all patients and sessions on this device. Continue?')) return;
        void eraseVault();
      }}
    >
      Forgot PIN — erase and start again
    </button>
  );
}
