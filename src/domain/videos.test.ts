import { describe, expect, it } from 'vitest';
import { findExercise } from '../data/exercises';
import { CHANNEL_VIDEOS, channelSearchUrl, defaultVideo, embedUrl, FALLBACK_VIDEOS, parseYouTubeLink, VIDEO_CHANNELS, watchUrl } from './videos';

describe('parseYouTubeLink', () => {
  it.each([
    ['https://www.youtube.com/watch?v=1ZXobu7JvvE', '1ZXobu7JvvE'],
    ['https://www.youtube.com/watch?v=1ZXobu7JvvE&list=PLdWvFCOAvyr3EWQhtfcEMd3DVM5sJdPL4&index=8', '1ZXobu7JvvE'],
    ['https://m.youtube.com/watch?feature=share&v=-LHetdLNhjI', '-LHetdLNhjI'],
    ['https://youtu.be/1ZXobu7JvvE', '1ZXobu7JvvE'],
    ['https://youtube.com/shorts/oyFfjMTAbEk?si=abc', 'oyFfjMTAbEk'],
    ['https://www.youtube-nocookie.com/embed/cRWACB-A_EY?start=5', 'cRWACB-A_EY'],
    ['  1ZXobu7JvvE  ', '1ZXobu7JvvE'],
  ])('reads the id from %s', (link, id) => {
    expect(parseYouTubeLink(link)?.id).toBe(id);
  });

  it.each([
    ['https://youtu.be/1ZXobu7JvvE?t=90', 90],
    ['https://www.youtube.com/watch?v=1ZXobu7JvvE&t=1m30s', 90],
    ['https://www.youtube.com/embed/1ZXobu7JvvE?start=12', 12],
    ['https://www.youtube.com/watch?v=1ZXobu7JvvE', 0],
  ])('reads the start time from %s', (link, startSec) => {
    expect(parseYouTubeLink(link)?.startSec).toBe(startSec);
  });

  it.each(['', 'hello', 'https://vimeo.com/123456789', 'https://www.youtube.com/watch?v=short', 'https://www.youtube.com/@CrossFit'])('rejects %s', (link) => {
    expect(parseYouTubeLink(link)).toBeNull();
  });
});

describe('video URLs', () => {
  it('builds a muted, looping, inline privacy-enhanced embed', () => {
    const url = new URL(embedUrl({ id: '1ZXobu7JvvE', startSec: 10 }));
    expect(url.origin).toBe('https://www.youtube-nocookie.com');
    expect(url.searchParams.get('mute')).toBe('1');
    expect(url.searchParams.get('loop')).toBe('1');
    expect(url.searchParams.get('playlist')).toBe('1ZXobu7JvvE');
    expect(url.searchParams.get('start')).toBe('10');
  });

  it('links to the watch page with the start time', () => {
    expect(watchUrl({ id: '1ZXobu7JvvE', startSec: 90 })).toBe('https://www.youtube.com/watch?v=1ZXobu7JvvE&t=90s');
  });
});

describe('default videos', () => {
  const all = [...Object.values(CHANNEL_VIDEOS).flatMap((videos) => Object.keys(videos)), ...Object.keys(FALLBACK_VIDEOS)];
  it.each(all)('%s is a known exercise', (exerciseId) => {
    expect(findExercise(exerciseId)).toBeDefined();
  });

  it('takes the first preferred channel that has a video, in Mika’s order', () => {
    const videos = {
      'squat-university': {},
      'elite-performance-institute': { bridge: { id: 'AAAAAAAAAAA', startSec: 0 } },
      'evolution-pt': { bridge: { id: 'BBBBBBBBBBB', startSec: 0 }, 'quad-set': { id: 'CCCCCCCCCCC', startSec: 0 } },
    };
    expect(defaultVideo('bridge', videos)).toMatchObject({ video: { id: 'AAAAAAAAAAA' }, channel: { name: 'Elite Performance Institute' } });
    expect(defaultVideo('quad-set', videos)?.channel?.name).toBe('Evolution PT');
    expect(defaultVideo('push-up', videos)?.channel).toBeNull();
    expect(defaultVideo('clamshell', videos)).toBeNull();
  });

  it('lists Squat University first, then Elite Performance Institute, then Evolution PT', () => {
    expect(VIDEO_CHANNELS.map((c) => c.handle)).toEqual(['@squatuniversity', '@eliteperformanceinstitute', '@evolutionptfit']);
  });

  it('searches inside a channel', () => {
    expect(channelSearchUrl('@squatuniversity', 'Single-leg squat')).toBe('https://www.youtube.com/@squatuniversity/search?query=Single-leg%20squat');
  });
});
