import { BufferAttribute, BufferGeometry } from 'three';
import { assert } from '../domain/assert';

/** One mesh of the anatomy model, as written by scripts/anatomy/build-model.mjs. */
export interface ModelPart {
  kind: 'bone' | 'muscle' | 'attachment';
  name: string;
  side: 'right' | 'left' | 'mid';
  boneId: string | null;
  muscleId: string | null;
  attachment: 'origin' | 'insertion' | null;
  geometry: BufferGeometry;
}

interface ManifestPart extends Omit<ModelPart, 'geometry'> {
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

const MODEL_URL = `${import.meta.env.BASE_URL}models/upper-limb`;

let pending: Promise<AnatomyModel> | null = null;

/** Download (once) and decode the upper-limb model. */
export function loadAnatomyModel(): Promise<AnatomyModel> {
  pending ??= fetchModel();
  return pending;
}

async function fetchModel(): Promise<AnatomyModel> {
  const [manifestResponse, binResponse] = await Promise.all([fetch(`${MODEL_URL}.json`), fetch(`${MODEL_URL}.bin`)]);
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
  return { kind, name, side, boneId, muscleId, attachment, geometry };
}
