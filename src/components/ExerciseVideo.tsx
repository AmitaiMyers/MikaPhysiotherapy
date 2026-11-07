import { useState } from 'react';
import type { VideoRef } from '../data/exerciseTypes';
import { resetVideoOverride, setVideoOverride, type VideoChoice } from '../domain/videoOverrides';
import { embedUrl, parseYouTubeLink, watchUrl } from '../domain/videos';
import { useOnlineStatus } from './useOnlineStatus';
import { Icon } from './Icon';

/** The demo video: a muted, looping YouTube player when there is a video and a connection. */
export function VideoPlayer({ title, video }: { title: string; video: VideoRef | null }) {
  const online = useOnlineStatus();
  if (video === null) return null;
  if (!online) return <p className="note">Offline — the demonstration video plays when you are back online.</p>;
  return (
    <div className="exercise-media">
      <div className="video-frame">
        <iframe src={embedUrl(video)} title={`${title} video`} allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" />
      </div>
      <a href={watchUrl(video)} target="_blank" rel="noreferrer" className="text-button small align-end">
        Open on YouTube <Icon name="external" size={16} />
      </a>
    </div>
  );
}

/** A place to look for a video, shown as a button while the editor is open. */
export interface VideoSearchLink {
  label: string;
  url: string;
}

/**
 * Change, remove or reset a YouTube video (saved on this device). The search links are listed in
 * order of preference; the last is shown as a plain text link.
 */
export function VideoLinkEditor({ state, searches, hint }: { state: VideoChoice; searches: VideoSearchLink[]; hint: string }) {
  const [editing, setEditing] = useState(false);
  const [link, setLink] = useState('');
  const parsed = parseYouTubeLink(link);
  const showLinkError = link.trim() !== '' && parsed === null;
  const preferred = searches.slice(0, -1);
  const last = searches.at(-1);

  const save = () => {
    if (parsed === null) return;
    setVideoOverride(state.key, parsed);
    setEditing(false);
    setLink('');
  };

  return (
    <section className="card">
      <h2>Video</h2>
      {state.video === null ? (
        <p className="muted small">No video yet. Paste a YouTube link to show a demonstration here.</p>
      ) : (
        <>
          {state.sourceLabel !== null && <p className="small muted">{state.sourceLabel}</p>}
          <a href={watchUrl(state.video)} target="_blank" rel="noreferrer" className="small video-link">
            {watchUrl(state.video)}
          </a>
        </>
      )}
      {editing ? (
        <form
          className="video-form"
          onSubmit={(event) => {
            event.preventDefault();
            save();
          }}
        >
          <div className="search-row">
            <input
              className="search-input"
              type="url"
              inputMode="url"
              aria-label="YouTube link"
              placeholder="https://www.youtube.com/watch?v=…"
              value={link}
              onChange={(event) => setLink(event.target.value)}
              autoFocus
            />
            <button type="submit" className="button button-primary" disabled={parsed === null}>
              Save
            </button>
          </div>
          {showLinkError && <p className="field-error">That doesn’t look like a YouTube video link.</p>}
          <p className="small muted">{hint}</p>
          {preferred.length > 0 && (
            <ol className="channel-list">
              {preferred.map((search) => (
                <li key={search.url}>
                  <a className="button" href={search.url} target="_blank" rel="noreferrer">
                    {search.label} <Icon name="external" size={16} />
                  </a>
                </li>
              ))}
            </ol>
          )}
          <div className="button-row">
            {last !== undefined && (
              <a className="text-button" href={last.url} target="_blank" rel="noreferrer">
                {last.label} <Icon name="external" size={16} />
              </a>
            )}
            <button type="button" className="text-button" onClick={() => setEditing(false)}>
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div className="button-row">
          <button type="button" className="button" onClick={() => setEditing(true)}>
            {state.video === null ? 'Add video' : 'Change video'}
          </button>
          {state.video !== null && (
            <button type="button" className="text-button danger" onClick={() => setVideoOverride(state.key, null)}>
              Remove
            </button>
          )}
          {state.hasDefault && state.overridden && (
            <button type="button" className="text-button" onClick={() => resetVideoOverride(state.key)}>
              Reset to default
            </button>
          )}
        </div>
      )}
      <p className="note">Videos come from YouTube and are not reviewed by this app — check the technique against the steps.</p>
    </section>
  );
}
