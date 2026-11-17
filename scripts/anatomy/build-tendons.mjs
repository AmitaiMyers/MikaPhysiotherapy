/**
 * Builds the tendon model (public/models/tendons.{json,bin}), run after build-model.mjs:
 *
 *   node scripts/anatomy/build-tendons.mjs
 *
 * Most tendons are part of their muscle's mesh, so their end of the muscle is carved off: the
 * muscle's long axis is found (principal component of its vertices), the end lying furthest in the
 * configured direction is chosen, and the triangles in the last share of its length become the
 * tendon. Because they are cut from the very meshes of the regional models, they sit exactly on the
 * muscles of the home-screen 3D body. A few tendons are separate meshes in the atlas.
 */
import { MeshoptSimplifier } from 'meshoptimizer';
import { SOURCE_FILES } from './config.mjs';
import { TENDON_SOURCES } from './meshes/tendons.mjs';
import { fail, loadMeshes, readModel, simplify, splitSide, writeModel } from './modelIo.mjs';

const REGIONS = ['head-neck', 'trunk-pelvis', 'upper-limb', 'lower-limb'];
/** Directions in model space; the body's right side (whose muscles the models hold) is −x. */
const DIRECTIONS = { up: [0, 1, 0], down: [0, -1, 0], lateral: [-1, 0, 0], medial: [1, 0, 0], front: [0, 0, 1], back: [0, 0, -1] };
const SIMPLIFY_TENDON = { ratio: 0.5, error: 0.003 };

/** Right-side and midline muscle parts of the regional models, each once (the models overlap at their borders). */
function regionalMuscles() {
  const byName = new Map();
  for (const region of REGIONS) {
    for (const part of readModel(region)) {
      if (part.kind !== 'muscle' || part.side === 'left' || byName.has(part.name)) continue;
      byName.set(part.name, part);
    }
  }
  return byName;
}

/** Principal axis of a point cloud by power iteration on its covariance. */
function principalAxis(positions) {
  const n = positions.length / 3;
  const mean = [0, 0, 0];
  for (let i = 0; i < positions.length; i++) mean[i % 3] += positions[i] / n;
  const c = [0, 0, 0, 0, 0, 0, 0, 0, 0];
  for (let i = 0; i < positions.length; i += 3) {
    const d = [positions[i] - mean[0], positions[i + 1] - mean[1], positions[i + 2] - mean[2]];
    for (let r = 0; r < 3; r++) for (let k = 0; k < 3; k++) c[r * 3 + k] += d[r] * d[k];
  }
  let v = [1, 1, 1];
  for (let step = 0; step < 50; step++) {
    const next = [0, 1, 2].map((r) => c[r * 3] * v[0] + c[r * 3 + 1] * v[1] + c[r * 3 + 2] * v[2]);
    const length = Math.hypot(...next);
    v = next.map((x) => x / length);
  }
  return { mean, axis: v };
}

/** The triangles of a muscle part lying in the last `fraction` of its length towards `end`. */
function carveEnd(part, { end, fraction }) {
  const direction = DIRECTIONS[end];
  if (direction === undefined) fail(`Unknown direction "${end}"`);
  const { mean, axis } = principalAxis(part.positions);
  // Point the axis towards the requested end.
  const sign = Math.sign(axis[0] * direction[0] + axis[1] * direction[1] + axis[2] * direction[2]) || 1;
  const along = (i) => sign * ((part.positions[i * 3] - mean[0]) * axis[0] + (part.positions[i * 3 + 1] - mean[1]) * axis[1] + (part.positions[i * 3 + 2] - mean[2]) * axis[2]);
  const count = part.positions.length / 3;
  let lo = Infinity;
  let hi = -Infinity;
  for (let i = 0; i < count; i++) {
    lo = Math.min(lo, along(i));
    hi = Math.max(hi, along(i));
  }
  const cut = hi - (hi - lo) * fraction;
  const keep = (i) => along(i) >= cut;
  const remap = new Map();
  const positions = [];
  const indices = [];
  for (let t = 0; t < part.indices.length; t += 3) {
    const tri = [part.indices[t], part.indices[t + 1], part.indices[t + 2]];
    if (!tri.every(keep)) continue;
    for (const old of tri) {
      if (!remap.has(old)) {
        remap.set(old, remap.size);
        positions.push(part.positions[old * 3], part.positions[old * 3 + 1], part.positions[old * 3 + 2]);
      }
      indices.push(remap.get(old));
    }
  }
  if (indices.length === 0) fail(`Carving ${part.name} towards ${end} left no triangles`);
  return { positions: new Float32Array(positions), indices: new Uint32Array(indices) };
}

/** Right-side meshes of the atlas muscles model, by name without the side letter. */
function atlasMeshes() {
  const byBase = new Map();
  for (const { name, geometry } of loadMeshes(SOURCE_FILES.muscles.file)) {
    const { base, side } = splitSide(name.replace(/\.\d+$/, ''), geometry);
    if (side !== 'left') byBase.set(base, [...(byBase.get(base) ?? []), { side, geometry }]);
  }
  return byBase;
}

async function main() {
  await MeshoptSimplifier.ready;
  const muscles = regionalMuscles();
  const atlas = atlasMeshes();
  const parts = [];
  for (const [tendonId, source] of Object.entries(TENDON_SOURCES)) {
    for (const spec of source.carve ?? []) {
      const part = muscles.get(spec.part);
      if (part === undefined) fail(`No muscle part "${spec.part}" in the regional models (${tendonId})`);
      parts.push({ kind: 'tendon', name: `${spec.part} (${spec.end} end)`, side: part.side, muscleId: part.muscleId, tendonId, ...carveEnd(part, spec) });
    }
    for (const name of source.atlas ?? []) {
      const found = atlas.get(name);
      if (found === undefined) fail(`No right-side atlas mesh "${name}" (${tendonId})`);
      for (const mesh of found) parts.push({ kind: 'tendon', name, side: mesh.side, tendonId, ...simplify(mesh.geometry, SIMPLIFY_TENDON) });
    }
  }
  writeModel('tendons', parts);
}

await main();
