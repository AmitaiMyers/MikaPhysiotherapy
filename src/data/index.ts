import { assert, required } from '../domain/assert';
import { BONES } from './catalog/bones';
import { JOINT_GROUPS, JOINTS } from './catalog/joints';
import { NERVE_GROUPS, NERVES } from './catalog/nerves';
import { REGIONS } from './catalog/regions';
import { SOURCES } from './catalog/sources';
import { SPECIAL_TESTS } from './catalog/specialTests';
import { ARM_MUSCLES } from './muscles/upperLimb/arm';
import { FOREARM_ANTERIOR_MUSCLES } from './muscles/upperLimb/forearmAnterior';
import { FOREARM_POSTERIOR_MUSCLES } from './muscles/upperLimb/forearmPosterior';
import { HAND_MUSCLES } from './muscles/upperLimb/hand';
import { PECTORAL_MUSCLES } from './muscles/upperLimb/pectoral';
import { POSTERIOR_AXIAL_MUSCLES } from './muscles/upperLimb/posteriorAxial';
import { SCAPULOHUMERAL_MUSCLES } from './muscles/upperLimb/scapulohumeral';
import { FOOT_MUSCLES } from './muscles/lowerLimb/foot';
import { GLUTEAL_MUSCLES, ILIOPSOAS_MUSCLES } from './muscles/lowerLimb/gluteal';
import { LEG_MUSCLES } from './muscles/lowerLimb/leg';
import { THIGH_MUSCLES } from './muscles/lowerLimb/thigh';
import { BACK_MUSCLES } from './muscles/trunkPelvis/back';
import { PELVIC_FLOOR_MUSCLES } from './muscles/trunkPelvis/pelvicFloor';
import { WALL_MUSCLES } from './muscles/trunkPelvis/walls';
import { HEAD_MUSCLES } from './muscles/headNeck/head';
import { NECK_MUSCLES } from './muscles/headNeck/neck';
import type { Bone, Joint, Muscle, Nerve, Region, Source, SpecialTest } from './types';

export { BONES, JOINT_GROUPS, JOINTS, NERVE_GROUPS, NERVES, REGIONS, SOURCES, SPECIAL_TESTS };

export const MUSCLES: Muscle[] = [
  ...NECK_MUSCLES,
  ...HEAD_MUSCLES,
  ...PECTORAL_MUSCLES,
  ...POSTERIOR_AXIAL_MUSCLES,
  ...SCAPULOHUMERAL_MUSCLES,
  ...ARM_MUSCLES,
  ...FOREARM_ANTERIOR_MUSCLES,
  ...FOREARM_POSTERIOR_MUSCLES,
  ...HAND_MUSCLES,
  ...GLUTEAL_MUSCLES,
  ...ILIOPSOAS_MUSCLES,
  ...THIGH_MUSCLES,
  ...LEG_MUSCLES,
  ...FOOT_MUSCLES,
  ...BACK_MUSCLES,
  ...WALL_MUSCLES,
  ...PELVIC_FLOOR_MUSCLES,
];

/** Index a list by id, failing fast on duplicates. */
export function indexById<T extends { id: string }>(items: T[], kind: string): Map<string, T> {
  const map = new Map<string, T>();
  for (const item of items) {
    assert(!map.has(item.id), `Duplicate ${kind} id "${item.id}"`);
    map.set(item.id, item);
  }
  return map;
}

const muscleById = indexById(MUSCLES, 'muscle');
const nerveById = indexById(NERVES, 'nerve');
const boneById = indexById(BONES, 'bone');
const jointById = indexById(JOINTS, 'joint');
const testById = indexById(SPECIAL_TESTS, 'special test');
const sourceById = indexById(SOURCES, 'source');
const regionById = indexById(REGIONS, 'region');

export const getMuscle = (id: string): Muscle => required(muscleById.get(id), `Unknown muscle "${id}"`);
export const getNerve = (id: string): Nerve => required(nerveById.get(id), `Unknown nerve "${id}"`);
export const getBone = (id: string): Bone => required(boneById.get(id), `Unknown bone "${id}"`);
export const getJoint = (id: string): Joint => required(jointById.get(id), `Unknown joint "${id}"`);
export const getSpecialTest = (id: string): SpecialTest => required(testById.get(id), `Unknown special test "${id}"`);
export const getSource = (id: string): Source => required(sourceById.get(id), `Unknown source "${id}"`);
export const getRegion = (id: string): Region => required(regionById.get(id), `Unknown region "${id}"`);

export const findMuscle = (id: string): Muscle | undefined => muscleById.get(id);
export const findNerve = (id: string): Nerve | undefined => nerveById.get(id);
export const findBone = (id: string): Bone | undefined => boneById.get(id);
export const findJoint = (id: string): Joint | undefined => jointById.get(id);
export const findSpecialTest = (id: string): SpecialTest | undefined => testById.get(id);
