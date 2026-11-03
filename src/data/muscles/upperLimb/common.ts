import type { Muscle } from '../../types';

/** References every upper-limb muscle was cross-checked against. */
export const UPPER_LIMB_SOURCES = ['teachmeanatomy', 'kenhub', 'wikipedia', 'physiopedia', 'z-anatomy'];

/** Fill in the fields that are the same for every upper-limb muscle. */
export function upperLimb(muscle: Omit<Muscle, 'regionId' | 'sourceIds'> & { extraSourceIds?: string[] }): Muscle {
  const { extraSourceIds = [], ...rest } = muscle;
  return { ...rest, regionId: 'upper-limb', sourceIds: [...UPPER_LIMB_SOURCES, ...extraSourceIds] };
}
