import { useRef, useState } from 'react';
import { restoreBackup } from '../../patients/backupIo';

/** Pick a backup file and replace the patient data on this device with it. */
export function RestoreBackup({ warnExisting }: { warnExisting: boolean }) {
  const input = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  return (
    <>
      <button type="button" className="button" onClick={() => input.current?.click()}>
        Restore from a backup file
      </button>
      <input
        ref={input}
        type="file"
        accept="application/json,.json"
        hidden
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = '';
          if (file === undefined) return;
          if (warnExisting && !window.confirm('Replace ALL patient data on this device with this backup? You will then unlock it with the PIN that was set when the backup was made.')) return;
          setError(null);
          restoreBackup(file).catch((reason: unknown) => setError(reason instanceof Error ? reason.message : 'The backup could not be restored.'));
        }}
      />
      {error !== null && <p className="field-error">{error}</p>}
    </>
  );
}
