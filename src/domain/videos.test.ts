import { describe, expect, it } from 'vitest';
import { findExercise } from '../data/exercises';
import { BUILT_IN_VIDEOS, embedUrl, parseYouTubeLink, watchUrl } from './videos';

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

describe('built-in videos', () => {
  it.each(Object.keys(BUILT_IN_VIDEOS))('%s is a known exercise', (exerciseId) => {
    expect(findExercise(exerciseId)).toBeDefined();
  });
});
