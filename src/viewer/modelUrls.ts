import type { RegionId } from '../data/types';

/** A 3D model file: one per body region, plus the whole-body ligament model. */
export type ModelName = RegionId | 'ligaments';

/** URLs of one 3D model (manifest and binary geometry). */
export function modelUrls(name: ModelName): { manifest: string; geometry: string } {
  const base = `${import.meta.env.BASE_URL}models/${name}`;
  return { manifest: `${base}.json`, geometry: `${base}.bin` };
}
