import { useState } from 'react';
import type { Exercise, VideoRef } from '../data/exerciseTypes';
import { resetVideoOverride, setVideoOverride, type ExerciseVideoState } from '../domain/videoOverrides';
import { embedUrl, parseYouTubeLink, searchUrl, watchUrl } from '../domain/videos';
import { useOnlineStatus } from './useOnlineStatus';

/** The demo video: a muted, looping YouTube player when there is a video and a connection. */
export function ExerciseVideoPlayer({ exercise, video }: { exercise: Exercise; video: VideoRef | null }) {
  const online = useOnlineStatus();
  if (video === null) return null;
  if (!online) return <p className="note">Offline — the demonstration video plays when you are back online.</p>;
  return (
    <div className="exercise-media">
      <div className="video-frame">
        <iframe
          src={embedUrl(video)}
          title={`${exercise.name} video`}
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>
      <a href={watchUrl(video)} target="_blank" rel="noreferrer" className="text-button small align-end">
        Open on YouTube ↗
      </a>
    </div>
  );
}

/** Change, remove or reset the YouTube video shown for an exercise (saved on this device). */
export function VideoLinkEditor({ exercise, state }: { exercise: Exercise; state: ExerciseVideoState }) {
  const [editing, setEditing] = useState(false);
  const [link, setLink] = useState('');
  const parsed = parseYouTubeLink(link);
  const showLinkError = link.trim() !== '' && parsed === null;

  const save = () => {
    if (parsed === null) return;
    setVideoOverride(exercise.id, parsed);
    setEditing(false);
    setLink('');
  };

  return (
    <section className="card">
      <h2>Video</h2>
      {state.video === null ? (
        <p className="muted small">No video yet. Paste a YouTube link to show a demonstration here.</p>
      ) : (
        <a href={watchUrl(state.video)} target="_blank" rel="noreferrer" className="small video-link">
          {watchUrl(state.video)}
        </a>
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
          <div className="button-row">
            <a className="text-button" href={searchUrl(exercise.name)} target="_blank" rel="noreferrer">
              Search YouTube ↗
            </a>
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
            <button type="button" className="text-button danger" onClick={() => setVideoOverride(exercise.id, null)}>
              Remove
            </button>
          )}
          {state.hasDefault && state.overridden && (
            <button type="button" className="text-button" onClick={() => resetVideoOverride(exercise.id)}>
              Reset to default
            </button>
          )}
        </div>
      )}
      <p className="note">Videos come from YouTube and are not reviewed by this app — check the technique against the steps.</p>
    </section>
  );
}
