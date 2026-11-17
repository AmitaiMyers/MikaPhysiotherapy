import { required } from '../../domain/assert';
import { indexById } from '../index';
import type { Tendon } from '../types';
import { LOWER_LIMB_TENDONS } from './lowerLimb';
import { HEAD_NECK_TENDONS, UPPER_LIMB_TENDONS } from './upperLimb';

/** The clinically key tendons, head to foot. */
export const TENDONS: Tendon[] = [...HEAD_NECK_TENDONS, ...UPPER_LIMB_TENDONS, ...LOWER_LIMB_TENDONS];

const tendonById = indexById(TENDONS, 'tendon');

export const getTendon = (id: string): Tendon => required(tendonById.get(id), `Unknown tendon "${id}"`);

/** A tendon's page: the Tendons tab of its first muscle, with the tendon open. */
export const tendonPath = (tendon: Tendon): string => `/muscles/${required(tendon.muscleIds[0], `Tendon "${tendon.id}" has no muscle`)}?tab=tendons&tendon=${tendon.id}`;

/** The tendons of a muscle, origin first. */
export const tendonsOfMuscle = (muscleId: string): Tendon[] => TENDONS.filter((t) => t.muscleIds.includes(muscleId)).sort((a, b) => (a.end === b.end ? 0 : a.end === 'origin' ? -1 : 1));
