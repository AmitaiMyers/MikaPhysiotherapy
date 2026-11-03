/**
 * Builds one 3D model per body region (public/models/<region>.{json,bin}).
 *
 *   node scripts/anatomy/build-model.mjs
 *
 * Steps: download the pinned Z-Anatomy FBX files (cached), parse them with three.js, keep the
 * part of the skeleton around each region plus the region's right-side (or midline) muscles and
 * their attachment areas, simplify every mesh with meshoptimizer, classify each attachment area as
 * origin or insertion from the app's own data, and write positions (int16, quantised to the model
 * bounds) and indices (uint16).
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { MeshoptSimplifier } from 'meshoptimizer';
import { createServer } from 'vite';
import { ALWAYS_EXCLUDE, BONE_NAME, BONE_RULES, MUSCLES_WITHOUT_MESH, REGION_MODELS, SOURCE_FILES } from './config.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const CACHE = join(ROOT, 'scripts', 'anatomy', '.cache');
const OUT = join(ROOT, 'public', 'models');

/**
 * Mean distance (cm) from an attachment area to the nearest vertex of its bone above which the area
 * is not used. Measured against the simplified bones, so areas on curved surfaces (e.g. the inner
 * costal margin) sit a few centimetres from the nearest vertex.
 */
const MAX_ATTACHMENT_DISTANCE = 3.5;

/** Fraction of triangles kept per mesh kind, and the maximum simplification error (relative). */
const SIMPLIFY = {
  muscle: { ratio: 0.3, error: 0.004 },
  bone: { ratio: 0.25, error: 0.004 },
  context: { ratio: 0.12, error: 0.01 },
  attachment: { ratio: 0.5, error: 0.004 },
};

function fail(message) {
  throw new Error(message);
}

async function ensureSources() {
  mkdirSync(CACHE, { recursive: true });
  for (const { url, file } of Object.values(SOURCE_FILES)) {
    const path = join(CACHE, file);
    if (existsSync(path)) continue;
    console.log(`Downloading ${url}`);
    const response = await fetch(url);
    if (!response.ok) fail(`Download failed (${response.status}): ${url}`);
    writeFileSync(path, Buffer.from(await response.arrayBuffer()));
  }
}

/** Parse an FBX file into a flat list of { name, positions } in world space (cm, Y up). */
function loadMeshes(file) {
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

function centerX(geometry) {
  geometry.computeBoundingBox();
  return (geometry.boundingBox.min.x + geometry.boundingBox.max.x) / 2;
}

/**
 * Z-Anatomy appends "r"/"l" to bilateral structures, but some labels are swapped, so the side is
 * taken from the geometry (the model's right side is -x) and the letter is only stripped.
 */
function splitSide(name, geometry) {
  const x = centerX(geometry);
  const side = x < -0.5 ? 'right' : x > 0.5 ? 'left' : 'mid';
  const bilateral = side !== 'mid' && /[rl]$/.test(name);
  return { base: bilateral ? name.slice(0, -1) : name, side };
}

/** Weld duplicate vertices, simplify, and return compact { positions: Float32Array, indices: Uint32Array }. */
function simplify(geometry, { ratio, error }) {
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

function mirrorX(geometry) {
  const mirrored = geometry.clone();
  mirrored.applyMatrix4(new THREE.Matrix4().makeScale(-1, 1, 1));
  // Mirroring flips the winding; swap two indices of every triangle so faces still point outwards.
  const index = mirrored.index ? mirrored.index.array : null;
  if (index) {
    for (let i = 0; i < index.length; i += 3) [index[i + 1], index[i + 2]] = [index[i + 2], index[i + 1]];
  } else {
    const p = mirrored.getAttribute('position');
    for (let i = 0; i < p.count; i += 3) {
      for (let axis = 0; axis < 3; axis++) {
        const a = p.getComponent(i + 1, axis);
        p.setComponent(i + 1, axis, p.getComponent(i + 2, axis));
        p.setComponent(i + 2, axis, a);
      }
    }
  }
  return mirrored;
}

function boneIdFor(base) {
  const rule = BONE_RULES.find(([pattern]) => pattern.test(base));
  return rule ? rule[1] : null;
}

/** Mean distance from sampled attachment vertices to the nearest vertex of each candidate bone. */
function nearestBone(attachment, bones) {
  const a = attachment.positions;
  const step = Math.max(1, Math.floor(a.length / 3 / 150));
  let best = null;
  for (const bone of bones) {
    const b = bone.positions;
    let total = 0;
    let samples = 0;
    for (let i = 0; i < a.length; i += 3 * step) {
      let min = Infinity;
      for (let j = 0; j < b.length; j += 3) {
        const dx = a[i] - b[j];
        const dy = a[i + 1] - b[j + 1];
        const dz = a[i + 2] - b[j + 2];
        const d = dx * dx + dy * dy + dz * dz;
        if (d < min) min = d;
      }
      total += Math.sqrt(min);
      samples++;
    }
    const mean = total / samples;
    if (!best || mean < best.distance) best = { bone, distance: mean };
  }
  return best;
}

/**
 * One right-side mesh per attachment area (base name + o/e code). Uses the mesh that lies on the
 * right; mirrors the left one when the right one is missing.
 */
function rightSideAttachments(skeletonMeshes, attachmentBases) {
  const byKey = new Map();
  for (const { name, geometry } of skeletonMeshes) {
    const match = name.match(/^(.*?)([oe]\d*)[rl]$/);
    if (!match || !attachmentBases.has(match[1])) continue;
    const [, base, code] = match;
    const key = `${base}${code}`;
    const onRight = centerX(geometry) < 0;
    const existing = byKey.get(key);
    if (!existing || (onRight && !existing.onRight)) byKey.set(key, { base, code, onRight, geometry });
  }
  return [...byKey.values()].map((a) => ({ ...a, geometry: a.onRight ? a.geometry : mirrorX(a.geometry) }));
}

async function loadAppMuscles() {
  const server = await createServer({ root: ROOT, logLevel: 'error', server: { middlewareMode: true }, appType: 'custom' });
  const data = await server.ssrLoadModule('/src/data/index.ts');
  await server.close();
  return data.MUSCLES;
}

/** Every bone of the skeleton file, simplified once and shared by all regional models. */
function prepareBones(skeletonMeshes) {
  const bones = [];
  for (const { name, geometry } of skeletonMeshes) {
    const { base, side } = splitSide(name, geometry);
    if (geometry.getAttribute('position').count <= 36 || !BONE_NAME.test(base) || ALWAYS_EXCLUDE.test(base)) continue;
    const boneId = boneIdFor(base);
    const box = geometry.boundingBox;
    const part = { kind: 'bone', name: base, side, boneId, ...simplify(geometry, boneId ? SIMPLIFY.bone : SIMPLIFY.context) };
    bones.push({ part, minY: box.min.y, maxY: box.max.y, centerX: centerX(geometry) });
  }
  return bones;
}

function inSkeletonWindow(bone, window) {
  if (window.minTop !== undefined && bone.maxY < window.minTop) return false;
  if (window.maxBottom !== undefined && bone.minY > window.maxBottom) return false;
  if (window.maxAbsX !== undefined && Math.abs(bone.centerX) > window.maxAbsX) return false;
  return !(window.exclude && window.exclude.test(bone.part.name));
}

/**
 * Meshes to draw for one Z-Anatomy muscle name: the right-side mesh of a bilateral muscle, or the
 * midline mesh; with `bothSides` (single muscles split into halves, e.g. the diaphragm) both halves.
 */
function findMuscleMeshes(muscleMeshes, meshName, bothSides) {
  const candidates = muscleMeshes.filter((m) => m.name === meshName || (/[rl]$/.test(m.name) && m.name.slice(0, -1) === meshName));
  if (bothSides) return candidates;
  const one = candidates.find((m) => centerX(m.geometry) < -0.5) ?? candidates.find((m) => Math.abs(centerX(m.geometry)) <= 0.5);
  return one ? [one] : [];
}

function validateConfig(appMuscles) {
  const appMuscleIds = new Set(appMuscles.map((m) => m.id));
  const configured = new Map();
  for (const [regionId, model] of Object.entries(REGION_MODELS)) {
    for (const id of Object.keys(model.muscles)) {
      if (!appMuscleIds.has(id)) fail(`${regionId} config lists unknown muscle "${id}"`);
      configured.set(id, regionId);
    }
  }
  for (const m of appMuscles) {
    if (MUSCLES_WITHOUT_MESH.includes(m.id)) continue;
    if (configured.get(m.id) !== m.regionId) fail(`No meshes configured for muscle "${m.id}" in its region model "${m.regionId}"`);
  }
}

/** Origin/insertion areas of one muscle, classified by the bone each area lies on. */
function classifyAttachments(muscle, config, attachmentMeshes, candidateBones, report) {
  const originBones = new Set(muscle.origin.flatMap((a) => a.bones));
  const insertionBones = new Set(muscle.insertion.flatMap((a) => a.bones));
  const parts = [];
  for (const { base, code, geometry } of attachmentMeshes.filter((a) => config.attachments.includes(a.base))) {
    const simplified = simplify(geometry, SIMPLIFY.attachment);
    const nearest = nearestBone(simplified, candidateBones);
    const boneId = nearest.bone.boneId;
    const isOrigin = originBones.has(boneId);
    const isInsertion = insertionBones.has(boneId);
    const line = `${muscle.id.padEnd(34)} ${`${base}${code}`.padEnd(58)} → ${boneId} (${nearest.distance.toFixed(2)} cm)`;
    if ((!isOrigin && !isInsertion) || nearest.distance > MAX_ATTACHMENT_DISTANCE) {
      report.push(`SKIP      ${line}`);
      continue;
    }
    // When the same bone carries both the origin and the insertion (e.g. longissimus on the thoracic
    // vertebrae), fall back to Z-Anatomy's own o/e label; it is only unreliable across different bones.
    const bothOnBone = isOrigin && isInsertion;
    const attachment = bothOnBone ? (code.startsWith('o') ? 'origin' : 'insertion') : isOrigin ? 'origin' : 'insertion';
    report.push(`${attachment.toUpperCase().padEnd(9)} ${line}${bothOnBone ? ' [same bone; Z-Anatomy label used]' : ''}`);
    parts.push({ kind: 'attachment', name: `${base}${code}`, side: 'right', muscleId: muscle.id, boneId, attachment, ...simplified });
  }
  return parts;
}

async function main() {
  await ensureSources();
  await MeshoptSimplifier.ready;
  const appMuscles = await loadAppMuscles();
  validateConfig(appMuscles);

  console.log('Parsing FBX files…');
  const muscleMeshes = loadMeshes(SOURCE_FILES.muscles.file);
  const skeletonMeshes = loadMeshes(SOURCE_FILES.skeleton.file);
  const bones = prepareBones(skeletonMeshes);
  const attachmentBases = new Set(Object.values(REGION_MODELS).flatMap((model) => Object.values(model.muscles).flatMap((m) => m.attachments)));
  const attachmentMeshes = rightSideAttachments(skeletonMeshes, attachmentBases);
  const report = [];

  for (const [regionId, model] of Object.entries(REGION_MODELS)) {
    if (Object.keys(model.muscles).length === 0) continue;
    const boneParts = bones.filter((bone) => inSkeletonWindow(bone, model.skeleton)).map((bone) => bone.part);
    const parts = [...boneParts];
    for (const [muscleId, config] of Object.entries(model.muscles)) {
      for (const meshName of config.meshes) {
        const found = findMuscleMeshes(muscleMeshes, meshName, config.bothSides === true);
        if (found.length === 0) fail(`Right-side or midline muscle mesh not found: ${meshName} (${muscleId})`);
        for (const mesh of found) {
          const { side } = splitSide(mesh.name, mesh.geometry);
          parts.push({ kind: 'muscle', name: meshName, side, muscleId, ...simplify(mesh.geometry, SIMPLIFY.muscle) });
        }
      }
    }
    const candidateBones = boneParts.filter((p) => p.boneId && p.side !== 'left');
    report.push(`--- ${regionId}`);
    for (const muscle of appMuscles.filter((m) => model.muscles[m.id])) {
      parts.push(...classifyAttachments(muscle, model.muscles[muscle.id], attachmentMeshes, candidateBones, report));
    }
    writeModel(regionId, parts);
  }
  writeFileSync(join(CACHE, 'attachments-report.txt'), `${report.join('\n')}\n`);
  console.log(report.filter((line) => line.startsWith('SKIP') || line.startsWith('---')).join('\n'));
}

function writeModel(regionId, parts) {
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

await main();
