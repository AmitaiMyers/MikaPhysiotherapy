import type { Muscle, RegionId } from '../types';

/** References every muscle record was cross-checked against. */
export const REFERENCE_SOURCES = ['teachmeanatomy', 'kenhub', 'wikipedia', 'physiopedia', 'z-anatomy'];

export type MuscleInput = Omit<Muscle, 'regionId' | 'sourceIds'> & { extraSourceIds?: string[] };

/** Returns a helper that fills in the fields shared by every muscle of a region. */
export function regionMuscle(regionId: RegionId): (muscle: MuscleInput) => Muscle {
  return ({ extraSourceIds = [], ...rest }) => ({ ...rest, regionId, sourceIds: [...REFERENCE_SOURCES, ...extraSourceIds] });
}
