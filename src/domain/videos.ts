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

/** The channels Mika prefers, in priority order: an exercise uses the first one that has a video for it. */
export const VIDEO_CHANNELS = [
  { id: 'squat-university', name: 'Squat University', handle: '@squatuniversity' },
  { id: 'elite-performance-institute', name: 'Elite Performance Institute', handle: '@eliteperformanceinstitute' },
  { id: 'evolution-pt', name: 'Evolution PT', handle: '@evolutionptfit' },
] as const;

export type ChannelId = (typeof VIDEO_CHANNELS)[number]['id'];

/** A search across all of YouTube, the last resort. */
export function searchUrl(exerciseName: string): string {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(`${exerciseName} physiotherapy exercise`)}`;
}

/** A search inside one channel, to find a video for an exercise. */
export function channelSearchUrl(handle: string, exerciseName: string): string {
  return `https://www.youtube.com/${handle}/search?query=${encodeURIComponent(exerciseName)}`;
}

const video = (id: string): VideoRef => ({ id, startSec: 0 });

/**
 * Videos from the preferred channels, keyed by channel and exercise id. Filled from each
 * channel's video list (it has to be read from YouTube, which this build environment cannot
 * reach yet). An exercise shows the video of the first channel in VIDEO_CHANNELS that has one.
 */
export const CHANNEL_VIDEOS: Readonly<Record<ChannelId, Readonly<Record<string, VideoRef>>>> = {
  'squat-university': {},
  'elite-performance-institute': {},
  'evolution-pt': {},
};

/**
 * Fallback videos (the workout app's, for the same movements) used until a preferred channel has
 * a video for the exercise.
 */
export const FALLBACK_VIDEOS: Readonly<Record<string, VideoRef>> = {
  'push-up': video('0pkjOk0EiAk'),
  deadlift: video('1ZXobu7JvvE'),
  'forward-lunge': video('7EmwtpAI8cM'),
  'kettlebell-swing': video('vdezTMulJ-k'),
  'goblet-squat': video('OwAh0sBFpec'),
  'hip-thrust': video('0WqJd_3REWc'),
  'rowing-ergometer': video('QPvYrfyGHi8'),
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

export interface DefaultVideo {
  video: VideoRef;
  /** The preferred channel it comes from, or null for a fallback video. */
  channel: (typeof VIDEO_CHANNELS)[number] | null;
}

/** The default video of an exercise: the first preferred channel that has one, else the fallback. */
export function defaultVideo(exerciseId: string, channelVideos: typeof CHANNEL_VIDEOS = CHANNEL_VIDEOS): DefaultVideo | null {
  for (const channel of VIDEO_CHANNELS) {
    const found = channelVideos[channel.id][exerciseId];
    if (found !== undefined) return { video: found, channel };
  }
  const fallback = FALLBACK_VIDEOS[exerciseId];
  return fallback === undefined ? null : { video: fallback, channel: null };
}
