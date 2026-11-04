import { useEffect, useRef, useState } from 'react';
import { Card } from '../../components/ui';
import { addAttachment, attachmentUrl, formatSize } from '../../patients/attachments';
import type { Attachment } from '../../patients/types';
import { deleteFileBytes, deleteRecord, useRecords } from '../../patients/vault';

/** Photos and PDFs of a patient, stored encrypted; tap to open. */
export function AttachmentsCard({ patientId, episodeId }: { patientId: string; episodeId: string | null }) {
  const all = useRecords('attachment');
  const attachments = all.filter((a) => a.patientId === patientId && (episodeId === null || a.episodeId === episodeId)).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <Card title={`Photos & documents (${attachments.length})`}>
      {attachments.length > 0 && (
        <ul className="attachment-grid">
          {attachments.map((attachment) => (
            <li key={attachment.id}>
              <AttachmentTile attachment={attachment} />
            </li>
          ))}
        </ul>
      )}
      <button type="button" className="button spaced-top" disabled={busy} onClick={() => input.current?.click()}>
        {busy ? 'Saving…' : 'Add photo or PDF'}
      </button>
      <input
        ref={input}
        type="file"
        accept="image/*,application/pdf"
        multiple
        hidden
        onChange={(event) => {
          const files = [...(event.target.files ?? [])];
          event.target.value = '';
          setBusy(true);
          setError(null);
          Promise.all(files.map((file) => addAttachment(file, patientId, episodeId)))
            .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : 'A file could not be saved.'))
            .finally(() => setBusy(false));
        }}
      />
      {error !== null && <p className="field-error">{error}</p>}
    </Card>
  );
}

function AttachmentTile({ attachment }: { attachment: Attachment }) {
  const [url, setUrl] = useState<string | null>(null);
  const isImage = attachment.mimeType.startsWith('image/');
  useEffect(() => {
    let created: string | null = null;
    let cancelled = false;
    void attachmentUrl(attachment).then((value) => {
      if (cancelled) {
        URL.revokeObjectURL(value);
        return;
      }
      created = value;
      setUrl(value);
    });
    return () => {
      cancelled = true;
      if (created !== null) URL.revokeObjectURL(created);
    };
  }, [attachment]);

  return (
    <div className="attachment-tile">
      <a href={url ?? undefined} target="_blank" rel="noreferrer" className="attachment-preview" aria-label={`Open ${attachment.name}`}>
        {isImage && url !== null ? <img src={url} alt="" /> : <span className="attachment-icon">{isImage ? '…' : 'PDF'}</span>}
      </a>
      <span className="attachment-name">{attachment.name}</span>
      <span className="muted small">
        {new Date(attachment.createdAt).toLocaleDateString()} · {formatSize(attachment.size)}
      </span>
      <button
        type="button"
        className="text-button small"
        onClick={() => {
          if (!window.confirm(`Delete ${attachment.name}?`)) return;
          deleteRecord('attachment', attachment.id);
          deleteFileBytes(attachment.id);
        }}
      >
        Delete
      </button>
    </div>
  );
}
