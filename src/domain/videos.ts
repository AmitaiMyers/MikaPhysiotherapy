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
 * Videos from the preferred channels, keyed by channel and exercise id. Chosen from each channel's
 * full list of videos and shorts (read through YouTube's InnerTube API) where the title clearly names
 * the exercise. An exercise shows the video of the first channel in VIDEO_CHANNELS that has one.
 */
export const CHANNEL_VIDEOS: Readonly<Record<ChannelId, Readonly<Record<string, VideoRef>>>> = {
  'squat-university': {
    'ab-rollout': video('h2c8V0YCD6c'),
    'adductor-stretch': video('rzZ8YO1qtps'),
    'bird-dog': video('GSuicJneDQU'),
    'box-jump': video('9lfhjmrC8Zo'),
    'bridge': video('tl6xvm4-Qk0'),
    'bulgarian-split-squat': video('boh7Ygy2Bnk'),
    'clamshell': video('rOrjp5u0WlA'),
    'copenhagen-adduction': video('6OZA6IRF1rw'),
    'dead-bug': video('0XVbn86Btj0'),
    'deadlift': video('sIVZ8mlWDVY'),
    'face-pull': video('VAhNnx42cF8'),
    'goblet-squat': video('0MbDHFGdL-s'),
    'hip-airplane': video('gnSxAnV2VVI'),
    'hip-thrust': video('RPHbUUjXFK4'),
    'kettlebell-swing': video('b1Kl_BNHQVw'),
    'lat-pulldown': video('xWJGKz9Sk9w'),
    'lateral-raise': video('RlxoA0Yy74k'),
    'nordic-hamstring': video('htyDuCI8cm8'),
    'push-up': video('wlCwjmrcdhg'),
    'retro-walking': video('1sEUi7QNceA'),
    'romanian-deadlift': video('2Sx8OyEwKzU'),
    'shoulder-press': video('9jEwoCP7sSc'),
    'single-leg-rdl': video('Zfr6wizR8rs'),
    'single-leg-squat': video('ZLeu2xFIOOU'),
  },
  'elite-performance-institute': {
    'adductor-squeeze': video('_ZE5oF1qaWo'),
    'ankle-alphabet': video('XtZG-vJl5aY'),
    'ankle-isometrics': video('icRP695vXWg'),
    'ankle-pumps': video('eVND5LqcfCM'),
    'band-er-neutral': video('DhhuPGw846w'),
    'band-lateral-walk': video('mdtN0M2FgqY'),
    'band-row': video('ujaOX9whpg0'),
    'biceps-curl': video('s3myFH0kx7M'),
    'calf-raise': video('_B6o13eoAuU'),
    'eccentric-heel-drop': video('voogAkkVDbA'),
    'front-plank': video('C-4YmV-g9lg'),
    'glute-set': video('AV4ZPBrZqa4'),
    'hammer-curl': video('4WqxR6KLO2E'),
    'hip-hike': video('KxLEj9HvBkU'),
    'isometric-calf-raise': video('40Y_5Tjny28'),
    'isometric-shoulder-er': video('ozhHe-u6uMM'),
    'isometric-shoulder-ir': video('wMJMGwnPb5c'),
    'isometric-wrist-extension': video('3Yu_iSo_syw'),
    'lateral-hop': video('0F65Sfvuv2k'),
    'lateral-step-up': video('Pk7ngkIQ6n0'),
    'long-lever-bridge': video('N5n6BDQlYbA'),
    'open-book': video('peeW19ofFUg'),
    'pallof-press': video('zs54H_ZYt1o'),
    'plantar-fascia-stretch': video('TADEbwsZQV4'),
    'pogo-hops': video('q78thYeb0jw'),
    'prone-hamstring-curl': video('LyDUBnBfDQc'),
    'prone-hip-extension': video('KL8bDB_BQi8'),
    'prone-press-up': video('a3NUkU_n0NE'),
    'prone-t-raise': video('uNX_zyeR8Dk'),
    'prone-y-raise': video('E5Mj7LCvmmE'),
    'quad-set': video('Tr3aP_-1aMg'),
    'return-to-run': video('3Olm4B9h82w'),
    'reverse-lunge': video('dLM7ESPQpiM'),
    'scapular-setting': video('ZpA--IW-boQ'),
    'serratus-punch': video('y1FPkIS85kY'),
    'shoulder-isometrics': video('nBqcKitUU3o'),
    'side-plank': video('eSG2iPMTSK8'),
    'sidelying-er': video('9C5sbTGYgYA'),
    'sidelying-hip-abduction': video('sRsFX7MZ7sM'),
    'single-leg-bridge': video('6QKAyxZMhLU'),
    'single-leg-calf-raise': video('u1Yc75YdiJA'),
    'sitting-chin-tuck': video('4KTb7MMg3Ws'),
    'slider-leg-curl': video('vPPtheKmwbw'),
    'split-squat': video('zCsZwLeXrCg'),
    'standing-band-adduction': video('WW6YN--iL1Q'),
    'standing-hip-abduction': video('oSeg71uSiIg'),
    'standing-hip-extension': video('otXo7QV1qOQ'),
    'step-up': video('hkjvfNYktck'),
    'suitcase-carry': video('vYodk3ojibA'),
    'thread-the-needle': video('7C8-zj3nRro'),
    'tibialis-raise': video('RHWRxiBe1iU'),
    'tyler-twist': video('DUfLc4n3ygg'),
    'wall-angel': video('7DWlRQ6SrRU'),
    'wall-sit': video('9funz5oA4ZA'),
    'wall-walk-flexion': video('-X4xtS_XxIE'),
    'wrist-extensor-stretch': video('7hlt3qJEecU'),
    'wrist-flexor-stretch': video('4bck5ow6p8Q'),
  },
  'evolution-pt': {
    'a-skip': video('ejT2_rlOFZ0'),
    'band-diagonals': video('R_Imorc-2AY'),
    'band-eversion': video('vuoOyCPKaU0'),
    'band-pull-apart': video('jgG1SzZl-is'),
    'broad-jump': video('h1qiWaBJNaM'),
    'cat-camel': video('Lip-ETs_HPw'),
    'childs-pose': video('By85S7GzA0Q'),
    'curl-up': video('N3byTDeLAd0'),
    'doorway-pec-stretch': video('0wU6V78E_lM'),
    'farmers-carry': video('rfvU4Und0-o'),
    'forward-lunge': video('2zveAzT22Uk'),
    'hamstring-stretch': video('6mzuTLc1z_c'),
    'heel-slide': video('ZkJQRHtMD9k'),
    'hip-90-90': video('9Qwt-00CQXI'),
    'inverted-row': video('2ax8bQRcLqk'),
    'knee-to-wall-lunge': video('1g3CzNOn87E'),
    'lateral-step-down': video('gRIV83Vt89U'),
    'quadriceps-stretch': video('-91nNQhkeaI'),
    'scaption-full-can': video('v8ypiI2SOag'),
    'seated-calf-raise': video('mMtIzJy_3Bs'),
    'seated-thoracic-rotation': video('Kj9llzG2-WQ'),
    'short-foot': video('OdOGaqsIRho'),
    'sidelying-hip-adduction': video('DCp_go-tio0'),
    'single-leg-hop': video('NCVM3bnAzYc'),
    'squat-jump': video('G16WFXCEcZ8'),
    'star-excursion-reach': video('X5SYBE_nARU'),
    'straight-leg-raise': video('Vf-daftte9w'),
    'superman': video('oFPFu43Tqe0'),
    'supine-chin-tuck': video('e7BUJFY54Jc'),
    'tandem-stance': video('kwKb61A0tVc'),
    'tendon-gliding': video('V-kMocuA1yY'),
    'toe-yoga': video('4YGALYFRyZ0'),
  },
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
