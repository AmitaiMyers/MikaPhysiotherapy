import { useRef, useState } from 'react';
import { restoreBackup } from '../../patients/backupIo';
import { confirmAction } from '../../feedback/store';

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
          const confirmed = warnExisting
            ? confirmAction({ title: 'Replace all patient data?', message: 'Everything on this device is replaced by the backup. You then unlock it with the PIN that was set when the backup was made.', confirmLabel: 'Restore backup' })
            : Promise.resolve(true);
          void confirmed.then((ok) => {
            if (!ok) return;
            setError(null);
            restoreBackup(file).catch((reason: unknown) => setError(reason instanceof Error ? reason.message : 'The backup could not be restored.'));
          });
        }}
      />
      {error !== null && <p className="field-error">{error}</p>}
    </>
  );
}
