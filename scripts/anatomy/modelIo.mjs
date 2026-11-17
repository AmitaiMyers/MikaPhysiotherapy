/**
 * Shared by the model builders (build-model.mjs, build-ligaments.mjs): reading the cached Z-Anatomy
 * FBX files, telling the body's sides apart, simplifying meshes, and writing a model the app's
 * loader (src/viewer/model.ts) reads.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { MeshoptSimplifier } from 'meshoptimizer';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
export const CACHE = join(ROOT, 'scripts', 'anatomy', '.cache');
const OUT = join(ROOT, 'public', 'models');

export function fail(message) {
  throw new Error(message);
}

/** Parse an FBX file into a flat list of { name, positions } in world space (cm, Y up). */
export function loadMeshes(file) {
  const buffer = readFileSync(join(CACHE, file));
  const root = new FBXLoader().parse(buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength), '');
  root.updateMatrixWorld(true);
  const meshes = [];
  root.traverse((object) => {
    if (!object.isMesh) return;
    const geometry = object.geometry.clone();
    geometry.applyMatrix4(object.matrixWorld);
    meshes.push({ name: object.name, geometry });
  });
  return meshes;
}

export function centerX(geometry) {
  geometry.computeBoundingBox();
  return (geometry.boundingBox.min.x + geometry.boundingBox.max.x) / 2;
}

/**
 * Z-Anatomy appends "r"/"l" to bilateral structures, but some labels are swapped, so the side is
 * taken from the geometry (the model's right side is -x) and the letter is only stripped.
 */
export function splitSide(name, geometry) {
  const x = centerX(geometry);
  const side = x < -0.5 ? 'right' : x > 0.5 ? 'left' : 'mid';
  const bilateral = side !== 'mid' && /[rl]$/.test(name);
  return { base: bilateral ? name.slice(0, -1) : name, side };
}

/** Weld duplicate vertices, simplify, and return compact { positions: Float32Array, indices: Uint32Array }. */
export function simplify(geometry, { ratio, error }) {
  const positionOnly = new THREE.BufferGeometry();
  positionOnly.setAttribute('position', geometry.getAttribute('position'));
  if (geometry.index) positionOnly.setIndex(geometry.index);
  const welded = mergeVertices(positionOnly, 1e-4);
  const positions = welded.getAttribute('position').array;
  const indices = new Uint32Array(welded.index.array);
  const target = Math.max(36, Math.floor((indices.length * ratio) / 3) * 3);
  const [simplified] = MeshoptSimplifier.simplify(indices, positions, 3, target, error);
  // Drop vertices no longer referenced.
  const remap = new Map();
  const outPositions = [];
  const outIndices = new Uint32Array(simplified.length);
  simplified.forEach((oldIndex, i) => {
    let newIndex = remap.get(oldIndex);
    if (newIndex === undefined) {
      newIndex = remap.size;
      remap.set(oldIndex, newIndex);
      outPositions.push(positions[oldIndex * 3], positions[oldIndex * 3 + 1], positions[oldIndex * 3 + 2]);
    }
    outIndices[i] = newIndex;
  });
  return { positions: new Float32Array(outPositions), indices: outIndices };
}

/** Write public/models/<name>.json and .bin: int16 positions quantised to the model bounds, uint16 indices. */
export function writeModel(regionId, parts) {
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  for (const part of parts) {
    for (let i = 0; i < part.positions.length; i += 3) {
      for (let axis = 0; axis < 3; axis++) {
        min[axis] = Math.min(min[axis], part.positions[i + axis]);
        max[axis] = Math.max(max[axis], part.positions[i + axis]);
      }
    }
  }
  const chunks = [];
  let offset = 0;
  const push = (typed) => {
    const bytes = Buffer.from(typed.buffer, typed.byteOffset, typed.byteLength);
    const padding = (4 - (bytes.length % 4)) % 4;
    chunks.push(bytes, Buffer.alloc(padding));
    const start = offset;
    offset += bytes.length + padding;
    return start;
  };
  const manifestParts = parts.map((part) => {
    const vertexCount = part.positions.length / 3;
    if (vertexCount >= 65536) fail(`${part.name} has ${vertexCount} vertices; raise simplification`);
    const quantised = new Int16Array(part.positions.length);
    for (let i = 0; i < part.positions.length; i++) {
      const axis = i % 3;
      quantised[i] = Math.round(((part.positions[i] - min[axis]) / (max[axis] - min[axis])) * 65535 - 32768);
    }
    return {
      kind: part.kind,
      name: part.name,
      side: part.side,
      boneId: part.boneId ?? null,
      muscleId: part.muscleId ?? null,
      attachment: part.attachment ?? null,
      ...(part.ligamentId === undefined ? {} : { ligamentId: part.ligamentId }),
      ...(part.tendonId === undefined ? {} : { tendonId: part.tendonId }),
      vertexCount,
      indexCount: part.indices.length,
      positionOffset: push(quantised),
      indexOffset: push(Uint16Array.from(part.indices)),
    };
  });
  mkdirSync(OUT, { recursive: true });
  writeFileSync(join(OUT, `${regionId}.bin`), Buffer.concat(chunks));
  const manifest = {
    version: 1,
    units: 'cm',
    bounds: { min, max },
    attribution: 'Z-Anatomy (CC BY-SA 4.0), derived from BodyParts3D © The Database Center for Life Science (CC BY-SA 2.1 JP). Simplified for the web.',
    parts: manifestParts,
  };
  writeFileSync(join(OUT, `${regionId}.json`), `${JSON.stringify(manifest)}\n`);
  const triangles = parts.reduce((sum, p) => sum + p.indices.length / 3, 0);
  console.log(`${regionId}: ${parts.length} parts, ${triangles} triangles, ${(offset / 1024 / 1024).toFixed(1)} MB`);
}

/** Decode a written model (public/models/<name>) back into { kind, name, side, muscleId, positions, indices } parts. */
export function readModel(name) {
  const manifest = JSON.parse(readFileSync(join(OUT, `${name}.json`), 'utf8'));
  const bin = readFileSync(join(OUT, `${name}.bin`));
  const buffer = bin.buffer.slice(bin.byteOffset, bin.byteOffset + bin.byteLength);
  const { min, max } = manifest.bounds;
  return manifest.parts.map((part) => {
    const quantised = new Int16Array(buffer, part.positionOffset, part.vertexCount * 3);
    const positions = new Float32Array(quantised.length);
    for (let i = 0; i < quantised.length; i++) {
      const axis = i % 3;
      positions[i] = ((quantised[i] + 32768) / 65535) * (max[axis] - min[axis]) + min[axis];
    }
    return { ...part, positions, indices: new Uint32Array(new Uint16Array(buffer, part.indexOffset, part.indexCount)) };
  });
}
