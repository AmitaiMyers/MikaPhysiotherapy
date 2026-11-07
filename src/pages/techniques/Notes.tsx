import { useState } from 'react';
import { VideoPlayer } from '../../components/ExerciseVideo';
import { TextAreaField, TextField } from '../../components/forms';
import { parseYouTubeLink, watchUrl } from '../../domain/videos';
import { useAuthorName } from '../../techniques/author';
import { deleteNote, saveTechniqueRecord, useTechniqueContent } from '../../techniques/store';
import type { Origin, TechniqueNote } from '../../techniques/types';
import { MediaGallery, MediaPicker, useMediaEdits } from './Media';
import { confirmAction, showToast } from '../../feedback/store';
import { Segmented } from '../../components/Segmented';
import { Icon } from '../../components/Icon';

/** "By Mika" or "From Dana · imported 7 Nov 2026". */
export function originLabel(author: string, origin: Origin): string {
  if (origin.kind === 'mine') return `By ${author}`;
  return `From ${origin.from} · imported ${new Date(origin.importedAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}`;
}

/** Mika's notes and variations on a technique, with photos and videos. */
export function NotesSection({ techniqueId }: { techniqueId: string }) {
  const { notes } = useTechniqueContent();
  const [adding, setAdding] = useState(false);
  const own = notes.filter((n) => n.techniqueId === techniqueId).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  return (
    <section className="card">
      <h2>My notes & variations</h2>
      {own.length === 0 && !adding && <p className="muted small">Add your own explanation, a variation you use, photos or a video.</p>}
      {own.map((note) => (
        <NoteView key={note.id} note={note} />
      ))}
      {adding ? (
        <NoteForm techniqueId={techniqueId} onDone={() => setAdding(false)} />
      ) : (
        <button type="button" className="button" onClick={() => setAdding(true)}>
          <Icon name="plus" size={18} /> Add note or variation
        </button>
      )}
    </section>
  );
}

function NoteView({ note }: { note: TechniqueNote }) {
  const [editing, setEditing] = useState(false);
  if (editing) return <NoteForm techniqueId={note.techniqueId} existing={note} onDone={() => setEditing(false)} />;
  return (
    <article className="note-entry">
      <div className="note-entry-header">
        <span className={`tag ${note.type === 'variation' ? 'tag-accent' : ''}`}>{note.type === 'variation' ? 'Variation' : 'Note'}</span>
        <strong>{note.title}</strong>
      </div>
      {note.text !== '' && <p className="pre-wrap">{note.text}</p>}
      <VideoPlayer title={note.title} video={note.video} />
      <MediaGallery mediaIds={note.mediaIds} />
      <p className="muted small">{originLabel(note.author, note.origin)}</p>
      <div className="button-row">
        <button type="button" className="text-button small" onClick={() => setEditing(true)}>
          Edit
        </button>
        <button
          type="button"
          className="text-button small danger"
          onClick={() => {
            void confirmAction({ title: 'Delete this note?', message: 'Its photos and videos are deleted from this device too.', confirmLabel: 'Delete note' }).then((confirmed) => {
              if (!confirmed) return;
              deleteNote(note);
              showToast('Note deleted');
            });
          }}
        >
          Delete
        </button>
      </div>
    </article>
  );
}

function NoteForm({ techniqueId, existing, onDone }: { techniqueId: string; existing?: TechniqueNote; onDone: () => void }) {
  const author = useAuthorName();
  const now = new Date().toISOString();
  const [note, setNote] = useState<TechniqueNote>(
    existing ?? { kind: 'note', id: crypto.randomUUID(), techniqueId, type: 'note', title: '', text: '', video: null, mediaIds: [], author, origin: { kind: 'mine' }, createdAt: now, updatedAt: now },
  );
  const [link, setLink] = useState(note.video === null ? '' : watchUrl(note.video));
  const parsed = parseYouTubeLink(link);
  const linkError = link.trim() !== '' && parsed === null;
  const update = (patch: Partial<TechniqueNote>) => setNote((current) => ({ ...current, ...patch }));
  const media = useMediaEdits(note.mediaIds);

  return (
    <form
      className="vault-form note-form"
      onSubmit={(event) => {
        event.preventDefault();
        media.commit();
        saveTechniqueRecord({ ...note, title: note.title.trim(), video: parsed, mediaIds: media.ids, updatedAt: new Date().toISOString() });
        onDone();
      }}
    >
      <Segmented
        label="Type"
        value={note.type}
        onChange={(type) => update({ type })}
        options={[
          { value: 'note', label: 'Note' },
          { value: 'variation', label: 'Variation' },
        ]}
      />
      <TextField label="Title" value={note.title} placeholder={note.type === 'variation' ? 'e.g. Sitting version for older patients' : 'e.g. My landmarks'} onChange={(title) => update({ title })} required />
      <TextAreaField label="Explanation" rows={5} value={note.text} onChange={(text) => update({ text })} />
      <TextField label="YouTube link (optional)" type="url" value={link} onChange={setLink} placeholder="https://www.youtube.com/watch?v=…" />
      {linkError && <p className="field-error">That doesn’t look like a YouTube video link.</p>}
      <MediaGallery mediaIds={media.ids} onRemove={media.remove} />
      <MediaPicker onAdded={media.add} />
      <div className="button-row">
        <button type="submit" className="button button-primary" disabled={note.title.trim() === '' || linkError}>
          Save
        </button>
        <button
          type="button"
          className="text-button"
          onClick={() => {
            media.discard();
            onDone();
          }}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
