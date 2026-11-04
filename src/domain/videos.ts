/**
 * YouTube demo videos for exercises, handled as in the companion workout app: embedded through
 * YouTube's privacy-enhanced player (never downloaded), so they need a connection.
 */
import type { VideoRef } from '../data/exerciseTypes';

const VIDEO_ID = '[A-Za-z0-9_-]{11}';
const LINK_PATTERNS: readonly RegExp[] = [
  new RegExp(`(?:youtube\\.com|youtube-nocookie\\.com)/(?:watch\\?(?:[^#]*&)?v=|embed/|shorts/|live/|v/)(${VIDEO_ID})(?![A-Za-z0-9_-])`),
  new RegExp(`youtu\\.be/(${VIDEO_ID})(?![A-Za-z0-9_-])`),
];
const BARE_ID = new RegExp(`^${VIDEO_ID}$`);

/** "90", "90s", "1m30s", "1h2m3s" → seconds; null when the text is not a time. */
function parseTimestamp(text: string): number | null {
  if (/^\d+$/.test(text)) return Number(text);
  const match = /^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/.exec(text);
  if (match === null || text === '') return null;
  const [, hours, minutes, seconds] = match;
  return Number(hours ?? 0) * 3600 + Number(minutes ?? 0) * 60 + Number(seconds ?? 0);
}

function startFrom(link: string): number {
  const match = /[?&#](?:t|start)=([0-9hms]+)/.exec(link);
  return match === null ? 0 : (parseTimestamp(match[1] ?? '') ?? 0);
}

/**
 * Read a YouTube link (watch, youtu.be, shorts, embed or live URL, or a bare video id)
 * including an optional start time. Returns null when the text is not a YouTube video.
 */
export function parseYouTubeLink(input: string): VideoRef | null {
  const text = input.trim();
  if (BARE_ID.test(text)) return { id: text, startSec: 0 };
  for (const pattern of LINK_PATTERNS) {
    const match = pattern.exec(text);
    if (match !== null && match[1] !== undefined) return { id: match[1], startSec: startFrom(text) };
  }
  return null;
}

export function watchUrl(video: VideoRef): string {
  const start = video.startSec > 0 ? `&t=${video.startSec}s` : '';
  return `https://www.youtube.com/watch?v=${video.id}${start}`;
}

/**
 * Privacy-enhanced embed that plays like a GIF: muted, inline, looping.
 * YouTube restarts a looped video from 0, so `start` only applies to the first play.
 */
export function embedUrl(video: VideoRef): string {
  const params = new URLSearchParams({
    autoplay: '1',
    mute: '1',
    loop: '1',
    playlist: video.id,
    playsinline: '1',
    rel: '0',
    start: String(video.startSec),
  });
  return `https://www.youtube-nocookie.com/embed/${video.id}?${params.toString()}`;
}

/** A YouTube search, to help find a video for an exercise without a default one. */
export function searchUrl(exerciseName: string): string {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(`${exerciseName} physiotherapy exercise`)}`;
}

const video = (id: string): VideoRef => ({ id, startSec: 0 });

/**
 * Default demo videos, keyed by exercise id. They are the same videos the workout app uses for
 * the same movements; every other exercise starts without a video and the user can add one.
 */
export const BUILT_IN_VIDEOS: Readonly<Record<string, VideoRef>> = {
  // CrossFit channel
  'push-up': video('0pkjOk0EiAk'),
  deadlift: video('1ZXobu7JvvE'),
  'forward-lunge': video('7EmwtpAI8cM'),
  'kettlebell-swing': video('vdezTMulJ-k'),
  // CrossFit affiliates
  'goblet-squat': video('OwAh0sBFpec'),
  'hip-thrust': video('0WqJd_3REWc'),
  // Concept2
  'rowing-ergometer': video('QPvYrfyGHi8'),
  // Other coaching channels
  'dumbbell-chest-press': video('J-gWN5hYwRU'),
  'dumbbell-row': video('fURsHPHgssI'),
  'lat-pulldown': video('RTNmVfnRitA'),
  'romanian-deadlift': video('GZAKFRNtxLY'),
  'bulgarian-split-squat': video('iwV9rTHKrOg'),
  'leg-press': video('cDGOn-yfKJA'),
  'seated-knee-extension': video('MXvSzXEBOTI'),
  'prone-hamstring-curl': video('SbSNUXPRkc8'),
  'calf-raise': video('wxwY7GXxL4k'),
  'shoulder-press': video('WKEl69bIGus'),
  'lateral-raise': video('OK1k6NdNo1I'),
  'biceps-curl': video('nBzLCE-dcRQ'),
  'hammer-curl': video('3nqezx8BEv0'),
  'triceps-pushdown': video('IBGvZUzoQiQ'),
  'front-plank': video('3QZlgJ40LfU'),
  'stationary-bike': video('qJb-FOTPT4Q'),
};
