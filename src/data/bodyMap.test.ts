import { describe, expect, it } from 'vitest';
import { bodyTarget, isVisible } from './bodyMap';
import generated from './generated/bodyMap.json';
import { findBone, findMuscle } from './index';

describe('body map', () => {
  it('only refers to muscles and bones that exist in the app', () => {
    for (const target of generated.targets) {
      if (target.kind === 'muscle') expect(findMuscle(target.id), target.id).toBeDefined();
      else expect(findBone(target.id), target.id).toBeDefined();
    }
  });

  it('shows the main muscles in the superficial layer and bones in the skeleton', () => {
    expect(isVisible({ kind: 'muscle', id: 'rectus-femoris' }, 'front', 'superficial')).toBe(true);
    expect(isVisible({ kind: 'muscle', id: 'gluteus-maximus' }, 'back', 'superficial')).toBe(true);
    expect(isVisible({ kind: 'bone', id: 'femur' }, 'front', 'skeleton')).toBe(true);
    expect(bodyTarget(0)).toBeNull();
  });

  it('peels away superficial muscles in the deep layer', () => {
    expect(isVisible({ kind: 'muscle', id: 'gluteus-maximus' }, 'back', 'deep')).toBe(false);
    expect(isVisible({ kind: 'muscle', id: 'gluteus-medius' }, 'back', 'deep')).toBe(true);
  });
});
