/**
 * Build-time page driven by render-nerves.mjs: the right-side peripheral nerves of the Z-Anatomy
 * nervous system (loaded from the FBX file the script serves), on the skeleton of the regional models.
 * One nerve is drawn bright, the other nerves faintly, and the muscles it supplies in translucent red.
 */
import { Box3, BufferGeometry, Color, Mesh, MeshStandardMaterial, Vector3, type Material } from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { CONTEXT_NERVE, NERVE_MESHES } from './meshes/nerves';
import { createStage, loadBody, OTHER_ID, skeletonFrame, TARGET_ID, type View } from './render-common';

const BONE = new MeshStandardMaterial({ color: new Color('#5d6870'), roughness: 0.85, metalness: 0 });
// Nerves are drawn after the translucent muscles (which write no depth), so they show through them
// like an illustration, while bone still hides them.
const NERVE = new MeshStandardMaterial({ color: new Color('#ffd23f'), roughness: 0.5, metalness: 0, emissive: new Color('#6b5000'), transparent: true, opacity: 1 });
const OTHER_NERVE = new MeshStandardMaterial({ color: new Color('#a8a07e'), roughness: 0.8, metalness: 0, transparent: true, opacity: 0.45, depthWrite: false });
const MUSCLE = new MeshStandardMaterial({ color: new Color('#e0645c'), roughness: 0.7, metalness: 0, transparent: true, opacity: 0.42, depthWrite: false });

const { bones, muscles } = await loadBody();
const { rightIsNegativeX, bounds: skeletonBounds } = skeletonFrame(bones);
const midline = skeletonBounds.getCenter(new Vector3()).x;
const isRight = (geometry: BufferGeometry) => {
  geometry.computeBoundingBox();
  const x = (geometry.boundingBox as Box3).getCenter(new Vector3()).x;
  return rightIsNegativeX ? x < midline : x > midline;
};
/** Small nerves are framed with at least 7% of the skeleton's height around them. */
const MIN_HALF_HEIGHT = skeletonBounds.getSize(new Vector3()).y * 0.07;

/** Right-side nerve meshes by Z-Anatomy name without the side letter. */
const wantedNames = new Set(Object.values(NERVE_MESHES).flat());
const nerveMeshes = new Map<string, Mesh[]>();
const buffer = await (await fetch('./NervousSystem100.fbx')).arrayBuffer();
const root = new FBXLoader().parse(buffer, '');
root.updateMatrixWorld(true);
root.traverse((object) => {
  // Names ending in "j" are Z-Anatomy's label lines for groups, not anatomy.
  if (!(object instanceof Mesh) || object.name.endsWith('j')) return;
  const name = /[rl]$/.test(object.name) ? object.name.slice(0, -1) : object.name;
  if (!wantedNames.has(name) && !CONTEXT_NERVE.test(name)) return;
  const geometry = (object.geometry as BufferGeometry).clone().applyMatrix4(object.matrixWorld);
  if (!isRight(geometry)) return;
  const mesh = new Mesh(geometry, OTHER_NERVE);
  mesh.renderOrder = 1;
  nerveMeshes.set(name, [...(nerveMeshes.get(name) ?? []), mesh]);
});
const missing = [...wantedNames].filter((name) => !nerveMeshes.has(name));
if (missing.length > 0) throw new Error(`No right-side mesh for ${missing.join(', ')}`);

const stage = createStage();
const boneMeshes = bones.map((part) => new Mesh(part.geometry, BONE));
const muscleMeshes = muscles.filter((part) => part.side !== 'left').map((part) => ({ muscleId: part.muscleId, mesh: new Mesh(part.geometry, MUSCLE) }));
const allNerves = [...nerveMeshes.values()].flat();
stage.scene.add(...boneMeshes, ...allNerves, ...muscleMeshes.map((m) => m.mesh));

/** Apply materials for one nerve: its meshes, the muscles it supplies, and everything else. */
function show(nerveId: string, muscleIds: string[], materials: { nerve: Material; otherNerve: Material; muscle: Material | null; bone: Material }): { nerves: Mesh[]; muscles: Mesh[] } {
  const names = NERVE_MESHES[nerveId];
  if (names === undefined) throw new Error(`No mesh list for nerve "${nerveId}" in meshes/nerves.ts`);
  const target = new Set(names.flatMap((name) => nerveMeshes.get(name) ?? []));
  const supplied = new Set(muscleIds);
  for (const mesh of allNerves) mesh.material = target.has(mesh) ? materials.nerve : materials.otherNerve;
  for (const mesh of boneMeshes) mesh.material = materials.bone;
  const shownMuscles: Mesh[] = [];
  for (const { muscleId, mesh } of muscleMeshes) {
    mesh.visible = materials.muscle !== null && muscleId !== null && supplied.has(muscleId);
    if (materials.muscle !== null) mesh.material = materials.muscle;
    if (muscleId !== null && supplied.has(muscleId)) shownMuscles.push(mesh);
  }
  return { nerves: [...target], muscles: shownMuscles };
}

function frameBox(parts: { nerves: Mesh[]; muscles: Mesh[] }): Box3 {
  const box = new Box3();
  for (const mesh of [...parts.nerves, ...parts.muscles]) box.union((mesh.geometry as BufferGeometry).boundingBox as Box3);
  return box;
}

function frame(parts: { nerves: Mesh[]; muscles: Mesh[] }, nerveId: string): Box3 {
  const box = frameBox(parts);
  if (box.isEmpty()) throw new Error(`Nothing to draw for nerve "${nerveId}"`);
  return box;
}

const tool = {
  /** Whether the model has the nerve or at least one muscle it supplies; otherwise there is no picture. */
  drawable(nerveId: string, muscleIds: string[]): boolean {
    return !frameBox(show(nerveId, muscleIds, { nerve: NERVE, otherNerve: OTHER_NERVE, muscle: MUSCLE, bone: BONE })).isEmpty();
  },
  /** Whether the model has the nerve itself (otherwise only its muscles are drawn). */
  drawn(nerveId: string): boolean {
    return (NERVE_MESHES[nerveId] ?? []).length > 0;
  },
  /** Visible pixels of the nerve (or, when it has no mesh, of its muscles) from a view. */
  coverage(nerveId: string, muscleIds: string[], view: View): number {
    const size = { width: 200, height: 250, padding: 1.4 };
    const drawn = tool.drawn(nerveId);
    const parts = show(nerveId, muscleIds, { nerve: TARGET_ID, otherNerve: OTHER_ID, muscle: drawn ? null : TARGET_ID, bone: OTHER_ID });
    return stage.countTarget(stage.camera(frame(parts, nerveId), view, rightIsNegativeX, size, MIN_HALF_HEIGHT), size.width, size.height);
  },
  image(nerveId: string, muscleIds: string[], view: View, width: number, height: number, padding: number): string {
    const parts = show(nerveId, muscleIds, { nerve: NERVE, otherNerve: OTHER_NERVE, muscle: MUSCLE, bone: BONE });
    return stage.picture(stage.camera(frame(parts, nerveId), view, rightIsNegativeX, { width, height, padding }, MIN_HALF_HEIGHT), width, height);
  },
};

(window as unknown as { nerveTool: typeof tool }).nerveTool = tool;
