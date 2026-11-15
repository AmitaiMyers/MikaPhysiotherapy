/**
 * Builds the ligament model (public/models/ligaments.{json,bin}) from the Z-Anatomy joints model
 * (and a few retinacula and aponeuroses from the muscles model):
 *
 *   node scripts/anatomy/build-ligaments.mjs
 *
 * Keeps the right-side and midline mesh of every structure listed in meshes/ligaments.mjs, simplifies
 * it, and writes one whole-body model in the same coordinate space as the regional models, so it can
 * be drawn over their skeleton.
 */
import { existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { MeshoptSimplifier } from 'meshoptimizer';
import { JOINTS_SOURCE, SOURCE_FILES } from './config.mjs';
import { LIGAMENT_MESHES } from './meshes/ligaments.mjs';
import { CACHE, fail, loadMeshes, simplify, splitSide, writeModel } from './modelIo.mjs';

/** Ligaments are small and smooth: keep more of their triangles than of muscles. */
const SIMPLIFY_LIGAMENT = { ratio: 0.4, error: 0.003 };
/** Z-Anatomy's group labels are tiny placeholder meshes, not anatomy. */
const MIN_VERTICES = 37;

async function ensureJointsModel() {
  const path = join(CACHE, JOINTS_SOURCE.file);
  if (existsSync(path)) return;
  console.log(`Downloading ${JOINTS_SOURCE.url}`);
  const response = await fetch(JOINTS_SOURCE.url);
  if (!response.ok) fail(`Download failed (${response.status}): ${JOINTS_SOURCE.url}`);
  writeFileSync(path, Buffer.from(await response.arrayBuffer()));
}

/** Mesh name without a ".001" copy suffix. */
const withoutCopySuffix = (name) => name.replace(/\.\d+$/, '');

/** Right-side and midline meshes of a file, by base name (side letter stripped where the mesh is bilateral). */
function meshesByBase(file) {
  const byBase = new Map();
  for (const { name, geometry } of loadMeshes(file)) {
    if (geometry.getAttribute('position').count < MIN_VERTICES) continue;
    const { base, side } = splitSide(withoutCopySuffix(name), geometry);
    if (side === 'left') continue;
    // A midline structure split into named halves (e.g. "…_ligamentl" / "…_ligamentr") is found under its name without the letter too.
    const bases = side === 'mid' && /[rl]$/.test(base) ? [base, base.slice(0, -1)] : [base];
    for (const key of bases) byBase.set(key, [...(byBase.get(key) ?? []), { name, side, geometry }]);
  }
  return byBase;
}

async function main() {
  await ensureJointsModel();
  await MeshoptSimplifier.ready;
  console.log('Parsing FBX files…');
  const files = { joints: meshesByBase(JOINTS_SOURCE.file), muscles: meshesByBase(SOURCE_FILES.muscles.file) };
  const parts = [];
  for (const [ligamentId, { file, meshes }] of Object.entries(LIGAMENT_MESHES)) {
    for (const base of meshes) {
      const found = files[file].get(base);
      if (found === undefined) fail(`No right-side or midline mesh "${base}" in the ${file} model (${ligamentId})`);
      for (const mesh of found) parts.push({ kind: 'ligament', name: base, side: mesh.side, ligamentId, ...simplify(mesh.geometry, SIMPLIFY_LIGAMENT) });
    }
  }
  writeModel('ligaments', parts);
}

await main();
