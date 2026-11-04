import { required } from '../../domain/assert';
import type { Protocol, ProtocolArea, ProtocolKind, ProtocolRegion } from '../protocolTypes';
import { indexById } from '../index';
import { PROTOCOL_DISCLAIMER, PROTOCOL_REGIONS } from './catalog';
import { LOWER_FRACTURE_PROTOCOLS } from './lowerFractures';
import { LOWER_SURGERY_PROTOCOLS } from './lowerSurgeries';
import { UPPER_FRACTURE_PROTOCOLS } from './upperFractures';
import { UPPER_SURGERY_PROTOCOLS } from './upperSurgeries';

export { PROTOCOL_DISCLAIMER, PROTOCOL_REGIONS };

export const PROTOCOLS: Protocol[] = [...LOWER_FRACTURE_PROTOCOLS, ...LOWER_SURGERY_PROTOCOLS, ...UPPER_FRACTURE_PROTOCOLS, ...UPPER_SURGERY_PROTOCOLS];

export const PROTOCOL_KIND_LABELS: Record<ProtocolKind, string> = { fracture: 'Fractures', surgery: 'Surgeries' };

const protocolById = indexById(PROTOCOLS, 'protocol');
const areaById = indexById(
  PROTOCOL_REGIONS.flatMap((region) => region.areas),
  'protocol area',
);

export const getProtocol = (id: string): Protocol => required(protocolById.get(id), `Unknown protocol "${id}"`);
export const findProtocol = (id: string): Protocol | undefined => protocolById.get(id);
export const getProtocolArea = (id: string): ProtocolArea => required(areaById.get(id), `Unknown protocol area "${id}"`);
export const getProtocolRegion = (id: string): ProtocolRegion =>
  required(
    PROTOCOL_REGIONS.find((region) => region.id === id),
    `Unknown protocol region "${id}"`,
  );

/** Protocols whose phases use an exercise, for the "Used in protocols" list on exercise pages. */
export const protocolsUsingExercise = (exerciseId: string): Protocol[] =>
  PROTOCOLS.filter((protocol) => protocol.phases.some((phase) => phase.exercises.some((e) => e.exerciseId === exerciseId)));
