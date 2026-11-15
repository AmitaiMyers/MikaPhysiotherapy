import { BufferAttribute, BufferGeometry } from 'three';
import { REGIONS } from '../data/catalog/regions';
import type { RegionId } from '../data/types';
import { assert } from '../domain/assert';
import { modelUrls, type ModelName } from './modelUrls';

/** One mesh of the anatomy model, as written by scripts/anatomy/build-model.mjs. */
export interface ModelPart {
  kind: 'bone' | 'muscle' | 'attachment' | 'ligament';
  name: string;
  side: 'right' | 'left' | 'mid';
  boneId: string | null;
  muscleId: string | null;
  attachment: 'origin' | 'insertion' | null;
  /** Set on parts of the ligament model only. */
  ligamentId: string | null;
  geometry: BufferGeometry;
}

interface ManifestPart extends Omit<ModelPart, 'geometry' | 'ligamentId'> {
  /** Written only by build-ligaments.mjs. */
  ligamentId?: string;
  vertexCount: number;
  indexCount: number;
  positionOffset: number;
  indexOffset: number;
}

interface Manifest {
  version: number;
  bounds: { min: [number, number, number]; max: [number, number, number] };
  attribution: string;
  parts: ManifestPart[];
}

export interface AnatomyModel {
  parts: ModelPart[];
  attribution: string;
}

const pending = new Map<ModelName, Promise<AnatomyModel>>();

/** Download (once per session) and decode the 3D model of one body region. */
export function loadAnatomyModel(regionId: RegionId): Promise<AnatomyModel> {
  return loadModel(regionId);
}

/** Download (once per session) and decode the whole-body ligament model (ligaments, capsules, menisci, discs). */
export function loadLigamentModel(): Promise<AnatomyModel> {
  return loadModel('ligaments');
}

function loadModel(name: ModelName): Promise<AnatomyModel> {
  let model = pending.get(name);
  if (!model) {
    model = fetchModel(name);
    pending.set(name, model);
  }
  return model;
}

async function fetchModel(name: ModelName): Promise<AnatomyModel> {
  const urls = modelUrls(name);
  const [manifestResponse, binResponse] = await Promise.all([fetch(urls.manifest), fetch(urls.geometry)]);
  assert(manifestResponse.ok && binResponse.ok, 'Could not download the 3D model');
  const manifest = (await manifestResponse.json()) as Manifest;
  assert(manifest.version === 1, `Unsupported model version ${manifest.version}`);
  const buffer = await binResponse.arrayBuffer();
  return { attribution: manifest.attribution, parts: manifest.parts.map((part) => decodePart(part, buffer, manifest.bounds)) };
}

/** Positions are int16 quantised to the model bounds; indices are uint16. */
function decodePart(part: ManifestPart, buffer: ArrayBuffer, bounds: Manifest['bounds']): ModelPart {
  const quantised = new Int16Array(buffer, part.positionOffset, part.vertexCount * 3);
  const positions = new Float32Array(quantised.length);
  for (let i = 0; i < quantised.length; i++) {
    const axis = i % 3;
    const min = bounds.min[axis] as number;
    const max = bounds.max[axis] as number;
    positions[i] = (((quantised[i] as number) + 32768) / 65535) * (max - min) + min;
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(positions, 3));
  geometry.setIndex(new BufferAttribute(new Uint16Array(buffer, part.indexOffset, part.indexCount), 1));
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  const { kind, name, side, boneId, muscleId, attachment } = part;
  return { kind, name, side, boneId, muscleId, attachment, ligamentId: part.ligamentId ?? null, geometry };
}

/**
 * Bones and muscles of the whole body: all regional models (they share one coordinate space), each
 * mesh once, since the models overlap at their borders. Attachment areas are left out.
 */
export async function loadBodyParts(): Promise<ModelPart[]> {
  const models = await Promise.all(REGIONS.map((region) => loadAnatomyModel(region.id)));
  const seen = new Set<string>();
  const parts: ModelPart[] = [];
  for (const part of models.flatMap((model) => model.parts)) {
    const key = `${part.kind}|${part.name}|${part.side}`;
    if (part.kind === 'attachment' || seen.has(key)) continue;
    seen.add(key);
    parts.push(part);
  }
  return parts;
}
