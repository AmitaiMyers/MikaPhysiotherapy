import { useEffect, useRef, useState } from 'react';
import { formatSize } from '../../domain/uploads';
import { addMedia, deleteMedia, mediaBlob, useTechniqueContent } from '../../techniques/store';
import type { MediaItem } from '../../techniques/types';
import { Icon } from '../../components/Icon';

/** Object URLs for stored media, revoked when the list changes or the screen closes. */
function useMediaUrls(items: MediaItem[]): Record<string, string> {
  const [urls, setUrls] = useState<Record<string, string>>({});
  const key = items.map((m) => m.id).join(',');
  useEffect(() => {
    let current = true;
    const created: string[] = [];
    void Promise.all(items.map(async (item) => [item.id, URL.createObjectURL(await mediaBlob(item.id))] as const)).then((entries) => {
      created.push(...entries.map(([, url]) => url));
      if (current) setUrls(Object.fromEntries(entries));
      else for (const url of created) URL.revokeObjectURL(url);
    });
    return () => {
      current = false;
      for (const url of created) URL.revokeObjectURL(url);
    };
    // The key stands for the list of media ids; the items array is new on every render.
  }, [key]);
  return urls;
}

/** Photos and videos, full width on the phone; optional remove buttons when editing. */
export function MediaGallery({ mediaIds, onRemove }: { mediaIds: string[]; onRemove?: (id: string) => void }) {
  const { media } = useTechniqueContent();
  const items = mediaIds.flatMap((id) => media.filter((m) => m.id === id));
  const urls = useMediaUrls(items);
  if (items.length === 0) return null;
  return (
    <div className="media-gallery">
      {items.map((item) => {
        const url = urls[item.id];
        return (
          <figure key={item.id} className="media-item">
            {url === undefined ? (
              <span className="media-loading">Loading…</span>
            ) : item.mimeType.startsWith('video/') ? (
              <video src={url} controls playsInline preload="metadata" />
            ) : (
              <a href={url} target="_blank" rel="noreferrer">
                <img src={url} alt={item.name} loading="lazy" />
              </a>
            )}
            <figcaption className="muted small">
              {item.name} · {formatSize(item.size)}
              {onRemove !== undefined && (
                <button type="button" className="text-button small danger" onClick={() => onRemove(item.id)}>
                  Remove
                </button>
              )}
            </figcaption>
          </figure>
        );
      })}
    </div>
  );
}

/** Add photos or videos; reports the new media ids. Files are stored straight away. */
export function MediaPicker({ onAdded }: { onAdded: (ids: string[]) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <div>
      <button type="button" className="button" disabled={busy} onClick={() => input.current?.click()}>
        {busy ? <Icon name="spinner" size={18} spin /> : <Icon name="plus" size={18} />}
        {busy ? 'Saving…' : 'Photo or video'}
      </button>
      <input
        ref={input}
        type="file"
        accept="image/*,video/*"
        multiple
        hidden
        onChange={(event) => {
          const files = [...(event.target.files ?? [])];
          event.target.value = '';
          if (files.length === 0) return;
          setBusy(true);
          setError(null);
          // Saving a file can fail (too large, storage full): the reason is shown under the button.
          Promise.all(files.map(addMedia))
            .then((items) => onAdded(items.map((item) => item.id)))
            .catch((reason: unknown) => setError(reason instanceof Error ? reason.message.replace(/^Assertion failed: /, '') : 'The file could not be saved.'))
            .finally(() => setBusy(false));
        }}
      />
      {error !== null && <p className="field-error">{error}</p>}
    </div>
  );
}

/**
 * Media changes in a form are only final when it is saved: files added and then cancelled, or
 * removed and then saved, are deleted from storage.
 */
export function useMediaEdits(initial: string[]) {
  const [ids, setIds] = useState(initial);
  const [added, setAdded] = useState<string[]>([]);
  return {
    ids,
    add: (newIds: string[]) => {
      setIds((current) => [...current, ...newIds]);
      setAdded((current) => [...current, ...newIds]);
    },
    remove: (id: string) => setIds((current) => current.filter((m) => m !== id)),
    /** Call when the form is saved. */
    commit: () => {
      for (const id of initial.filter((m) => !ids.includes(m))) deleteMedia(id);
    },
    /** Call when the form is cancelled. */
    discard: () => {
      for (const id of added) deleteMedia(id);
    },
  };
}
