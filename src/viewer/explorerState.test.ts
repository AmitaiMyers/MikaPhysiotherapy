import { describe, expect, it } from 'vitest';
import { MUSCLES } from '../data';
import depths from '../data/generated/muscleDepth.json';
import { depthLabel, INITIAL_STATE, muscleLook, SKELETON_DEPTH, withDepth, withFocusToggled, withLooksReset, withFlightDone, withSeeThroughToggled, withTap, withTendonShown } from './explorerState';

const DEPTHS: Record<string, number> = depths;
const surface = 'deltoid';
const deep = 'subscapularis';

describe('3D explorer state', () => {
  it('knows the depth layer of real muscles only', () => {
    const known = new Set(MUSCLES.map((m) => m.id));
    expect(Object.keys(DEPTHS).filter((id) => !known.has(id))).toEqual([]);
    expect(DEPTHS[surface]).toBe(0);
    expect(DEPTHS[deep]).toBeGreaterThan(0);
  });

  it('peels layers from the surface down to the skeleton', () => {
    expect(muscleLook(INITIAL_STATE, surface)).toBe('solid');
    expect(muscleLook(INITIAL_STATE, deep)).toBe('solid');
    const peeled = withDepth(INITIAL_STATE, 1);
    expect(muscleLook(peeled, surface)).toBe('hidden');
    expect(muscleLook(peeled, deep)).toBe('solid');
    const skeleton = withDepth(INITIAL_STATE, SKELETON_DEPTH);
    expect(Object.keys(DEPTHS).filter((id) => muscleLook(skeleton, id) !== 'hidden')).toEqual([]);
  });

  it('rejects a depth outside the slider', () => {
    expect(() => withDepth(INITIAL_STATE, SKELETON_DEPTH + 1)).toThrow();
    expect(() => withDepth(INITIAL_STATE, -1)).toThrow();
  });

  it('labels the slider stops', () => {
    expect(depthLabel(0)).toBe('All muscles');
    expect(depthLabel(1)).toBe('1 layer removed');
    expect(depthLabel(2)).toBe('2 layers removed');
    expect(depthLabel(SKELETON_DEPTH)).toBe('Skeleton');
  });

  it('makes a muscle see-through and back, keeping it visible when its layer is peeled', () => {
    const glass = withSeeThroughToggled(INITIAL_STATE, surface);
    expect(muscleLook(glass, surface)).toBe('glass');
    expect(muscleLook(glass, deep)).toBe('solid');
    expect(muscleLook(withDepth(glass, 2), surface)).toBe('glass');
    expect(muscleLook(withSeeThroughToggled(glass, surface), surface)).toBe('solid');
  });

  it('focuses one muscle by fading the others, without bringing back peeled ones', () => {
    const focused = withFocusToggled(withDepth(INITIAL_STATE, 1), deep);
    expect(muscleLook(focused, deep)).toBe('solid');
    expect(muscleLook(focused, 'supraspinatus')).toBe('ghost');
    expect(muscleLook(focused, surface)).toBe('hidden');
    expect(withFocusToggled(focused, deep).focused).toBeNull();
  });

  it('resets looks but keeps the layers and the selection', () => {
    const selected = withTap(INITIAL_STATE, { kind: 'muscle', id: surface });
    const state = withFocusToggled(withSeeThroughToggled(withDepth(selected, 2), surface), deep);
    expect(withLooksReset(state)).toEqual({ ...INITIAL_STATE, depth: 2, selected: { kind: 'muscle', id: surface } });
  });

  it('selects on tap and clears on a second tap or a tap on nothing', () => {
    const target = { kind: 'muscle' as const, id: surface };
    const selected = withTap(INITIAL_STATE, target);
    expect(selected.selected).toEqual(target);
    expect(withTap(selected, { ...target }).selected).toBeNull();
    expect(withTap(selected, null).selected).toBeNull();
    expect(withTap(selected, { kind: 'bone', id: 'femur' }).selected).toEqual({ kind: 'bone', id: 'femur' });
  });

  it('shows a tendon from another page: selects it, focuses its muscle solid, and flies there once', () => {
    const shown = withTendonShown(withSeeThroughToggled(INITIAL_STATE, 'soleus'), 'achilles-tendon', 'soleus');
    expect(shown.selected).toEqual({ kind: 'tendon', id: 'achilles-tendon' });
    expect(shown.focused).toBe('soleus');
    expect(muscleLook(shown, 'soleus')).toBe('solid');
    expect(shown.flyToSelected).toBe(true);
    expect(withFlightDone(shown).flyToSelected).toBe(false);
  });
});
