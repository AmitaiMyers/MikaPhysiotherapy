import { assert } from '../domain/assert';
import type { SpinalRoot } from './types';

/** Every root, in segment order (cranial nerves first). */
export const ROOT_ORDER: SpinalRoot[] = [
  'CN V', 'CN VII', 'CN XI', 'CN XII',
  'C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7', 'C8',
  'T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12',
  'L1', 'L2', 'L3', 'L4', 'L5',
  'S1', 'S2', 'S3', 'S4', 'S5', 'Co1',
];

/** All roots from `first` to `last` inclusive, e.g. rootRange('T7', 'T12'). */
export function rootRange(first: SpinalRoot, last: SpinalRoot): SpinalRoot[] {
  const start = ROOT_ORDER.indexOf(first);
  const end = ROOT_ORDER.indexOf(last);
  assert(start >= 0 && end >= start, `Invalid root range ${first}–${last}`);
  return ROOT_ORDER.slice(start, end + 1);
}
