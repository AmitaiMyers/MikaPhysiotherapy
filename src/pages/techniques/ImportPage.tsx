import { useRef, useState } from 'react';
import { Link } from 'react-router';
import { Card, Note, PageHeader } from '../../components/ui';
import { parseExchange, planImport, type ExchangeFile, type ImportChoice } from '../../techniques/exchange';
import { importTechniques } from '../../techniques/exchangeIo';
import { useTechniqueContent } from '../../techniques/store';

const CHOICE_LABELS: Record<ImportChoice, string> = { 'keep-both': 'Keep both', replace: 'Replace mine', skip: 'Skip' };

/** Import a technique file from another physiotherapist. */
export function TechniqueImportPage() {
  const content = useTechniqueContent();
  const input = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<ExchangeFile | null>(null);
  const [choices, setChoices] = useState<Record<string, ImportChoice>>({});
  const [error, setError] = useState<string | null>(null);
  const [imported, setImported] = useState<number | null>(null);
  const plan = file === null ? [] : planImport(file, content);
  const importable = plan.filter((item) => !item.unavailable && (choices[item.id] ?? 'keep-both') !== 'skip');

  return (
    <div className="page">
      <PageHeader back title="Import techniques" />
      <Card title="1. Choose the file">
        <p className="small">Open the technique file a colleague sent you (it ends in .technique.json). Save it from WhatsApp or email to your files first.</p>
        <button type="button" className="button button-primary spaced-top" onClick={() => input.current?.click()}>
          {file === null ? 'Choose file' : 'Choose another file'}
        </button>
        <input
          ref={input}
          type="file"
          accept=".json,application/json"
          hidden
          onChange={(event) => {
            const chosen = event.target.files?.[0];
            event.target.value = '';
            if (chosen === undefined) return;
            setError(null);
            setImported(null);
            setChoices({});
            // A file that is not a technique file is reported, not thrown.
            chosen
              .text()
              .then((text) => setFile(parseExchange(text)))
              .catch((reason: unknown) => {
                setFile(null);
                setError(reason instanceof Error ? reason.message.replace(/^Assertion failed: /, '') : 'The file could not be read.');
              });
          }}
        />
        {error !== null && <p className="field-error">{error}</p>}
      </Card>
      {file !== null && imported === null && (
        <Card title={`2. From ${file.author} · ${new Date(file.exportedAt).toLocaleDateString()}`}>
          <ul className="import-list">
            {plan.map((item) => (
              <li key={item.id}>
                <span>
                  <strong>{item.label}</strong>
                  <br />
                  <span className="muted small">
                    {item.kind === 'technique' ? 'Technique' : `Note on ${item.belongsTo ?? ''}`}
                    {item.conflict ? ' · you already have it' : ''}
                    {item.unavailable ? ' · this technique is not in your version of the app' : ''}
                  </span>
                </span>
                {!item.unavailable && (
                  <select aria-label={`Import ${item.label}`} value={choices[item.id] ?? 'keep-both'} onChange={(event) => setChoices((current) => ({ ...current, [item.id]: event.target.value as ImportChoice }))}>
                    {(item.conflict ? (['keep-both', 'replace', 'skip'] as const) : (['keep-both', 'skip'] as const)).map((choice) => (
                      <option key={choice} value={choice}>
                        {item.conflict ? CHOICE_LABELS[choice] : choice === 'keep-both' ? 'Import' : 'Skip'}
                      </option>
                    ))}
                  </select>
                )}
              </li>
            ))}
          </ul>
          {file.media.length > 0 && <p className="muted small">Includes {file.media.length} photos or videos.</p>}
          <button
            type="button"
            className="button button-primary spaced-top"
            disabled={importable.length === 0}
            onClick={() => {
              importTechniques(file, choices)
                .then(setImported)
                .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : 'The import failed.'));
            }}
          >
            Import {importable.length} {importable.length === 1 ? 'item' : 'items'}
          </button>
          <Note>Imported techniques and notes are marked “From {file.author}”. Nothing is shared back.</Note>
        </Card>
      )}
      {imported !== null && (
        <Card title="Done">
          <p>
            Imported {imported} {imported === 1 ? 'item' : 'items'}.
          </p>
          <Link to="/techniques" className="button button-primary spaced-top">
            Open techniques
          </Link>
        </Card>
      )}
    </div>
  );
}
