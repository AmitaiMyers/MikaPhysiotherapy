import type { RegionId } from '../data/types';

/** URLs of one region's 3D model (manifest and binary geometry). */
export function modelUrls(regionId: RegionId): { manifest: string; geometry: string } {
  const base = `${import.meta.env.BASE_URL}models/${regionId}`;
  return { manifest: `${base}.json`, geometry: `${base}.bin` };
}
