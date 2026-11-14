/**
 * Build-time page driven by muscle-depth.mjs: works out how deep each muscle lies by peeling the
 * body like an onion. A muscle is "on the surface" when, from the front, back or side, a fair share
 * of its own outline is visible; surface muscles get the current layer and are removed, and the
 * next round finds the layer beneath.
 */
import { Box3, Color, LinearSRGBColorSpace, Mesh, MeshBasicMaterial, OrthographicCamera } from 'three';
import { createStage, loadBody, skeletonFrame, type View } from './render-common';

const WIDTH = 300;
const HEIGHT = 700;
const VIEWS: View[] = ['anterior', 'posterior', 'lateral'];
/** Share of a muscle's own outline that must show for it to count as on the surface. */
const VISIBLE_SHARE = 0.3;
/** Outlines smaller than this (pixels) are too small to judge; such a muscle needs only a few visible pixels. */
const MIN_OUTLINE = 12;

const { bones, muscles } = await loadBody();
const { rightIsNegativeX } = skeletonFrame(bones);
const stage = createStage();
const BLACK = new MeshBasicMaterial({ color: 0x000000 });

const muscleIds = [...new Set(muscles.map((part) => part.muscleId ?? ''))];
const idColour = (index: number) => new MeshBasicMaterial({ color: new Color().setRGB((index & 0xff) / 255, ((index >> 8) & 0xff) / 255, 1, LinearSRGBColorSpace) });
const idMaterials = new Map(muscleIds.map((id, i) => [id, idColour(i)]));

const boneMeshes = bones.map((part) => new Mesh(part.geometry, BLACK));
const muscleMeshes = muscles.map((part) => ({ muscleId: part.muscleId ?? '', mesh: new Mesh(part.geometry, idMaterials.get(part.muscleId ?? '') ?? BLACK) }));
stage.scene.add(...boneMeshes, ...muscleMeshes.map((m) => m.mesh));

const bounds = new Box3();
for (const part of [...bones, ...muscles]) if (part.geometry.boundingBox) bounds.union(part.geometry.boundingBox);
const cameras = new Map<View, OrthographicCamera>(VIEWS.map((view) => [view, stage.camera(bounds, view, rightIsNegativeX, { width: WIDTH, height: HEIGHT, padding: 1.02 }, 0)]));

/** Pixels per muscle index in the current scene, from one view. */
function count(view: View): Map<number, number> {
  const pixels = stage.readIds(cameras.get(view) as OrthographicCamera, WIDTH, HEIGHT);
  const counts = new Map<number, number>();
  for (let i = 0; i < pixels.length; i += 4) {
    if ((pixels[i + 2] as number) < 200 || (pixels[i + 3] as number) === 0) continue;
    const index = (pixels[i] as number) + (pixels[i + 1] as number) * 256;
    counts.set(index, (counts.get(index) ?? 0) + 1);
  }
  return counts;
}

const tool = {
  /** Muscle id → layer (0 = surface), peeling until every muscle has one. */
  layers(): Record<string, number> {
    // Each muscle's own outline per view, drawn alone.
    const outline = new Map<string, Map<View, number>>();
    for (const mesh of boneMeshes) mesh.visible = false;
    for (const [i, id] of muscleIds.entries()) {
      for (const m of muscleMeshes) m.mesh.visible = m.muscleId === id;
      outline.set(id, new Map(VIEWS.map((view) => [view, count(view).get(i) ?? 0])));
    }
    for (const mesh of boneMeshes) mesh.visible = true;

    const result: Record<string, number> = {};
    let remaining = new Set(muscleIds);
    for (let layer = 0; remaining.size > 0; layer++) {
      for (const m of muscleMeshes) m.mesh.visible = remaining.has(m.muscleId);
      const surface = new Set<string>();
      for (const view of VIEWS) {
        const counts = count(view);
        for (const [i, id] of muscleIds.entries()) {
          if (!remaining.has(id)) continue;
          const own = outline.get(id)?.get(view) ?? 0;
          const seen = counts.get(i) ?? 0;
          if (seen > 0 && (own < MIN_OUTLINE || seen >= own * VISIBLE_SHARE)) surface.add(id);
        }
      }
      // Muscles hidden from all three views even when everything above is gone (wrapped by bone) join the last layer.
      const peeled = surface.size > 0 ? surface : remaining;
      for (const id of peeled) result[id] = layer;
      remaining = new Set([...remaining].filter((id) => !peeled.has(id)));
    }
    return result;
  },
};

(window as unknown as { depthTool: typeof tool }).depthTool = tool;
