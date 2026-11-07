/**
 * Build-time page driven by render-bones.mjs: loads the skeleton of all four regional models (one
 * coordinate space, duplicates removed) and renders one bone, or the bones of one joint, highlighted
 * against the rest of the skeleton. The body's right side is used, as in the muscle images.
 */
import { Box3, Color, Mesh, MeshStandardMaterial, Vector3 } from 'three';
import type { ModelPart } from '../../src/viewer/model';
import { createStage, loadBody, OTHER_ID, skeletonFrame, TARGET_ID, type View } from './render-common';

export type BoneView = View;

const { bones } = await loadBody();
const HIGHLIGHT = new MeshStandardMaterial({ color: new Color('#f4ead3'), roughness: 0.6, metalness: 0, emissive: new Color('#3a3226') });
const CONTEXT = new MeshStandardMaterial({ color: new Color('#5d6870'), roughness: 0.85, metalness: 0 });

const stage = createStage();
const meshes = bones.map((part) => {
  const mesh = new Mesh(part.geometry, CONTEXT);
  stage.scene.add(mesh);
  return { part, mesh };
});

/** The right side of the body, plus midline bones. */
const isTarget = (part: ModelPart, boneIds: Set<string>) => part.boneId !== null && boneIds.has(part.boneId) && part.side !== 'left';

const { rightIsNegativeX, bounds: allBounds } = skeletonFrame(bones);
/** Small bones are framed with at least 7% of the skeleton's height around them, so they are recognisable. */
const MIN_HALF_HEIGHT = allBounds.getSize(new Vector3()).y * 0.07;

export type Focus = 'whole' | 'contact';

/**
 * The box to frame: the whole highlighted bones, or for a joint ("contact") the region where its
 * bones meet — the overlap of each pair of bones' boxes — so the knee shows the knee, not the leg.
 */
function frameBounds(boneIds: string[], focus: Focus): Box3 {
  const perBone = new Map<string, Box3>();
  for (const { part } of meshes) {
    if (!isTarget(part, new Set(boneIds)) || part.boneId === null || part.geometry.boundingBox === null) continue;
    const box = perBone.get(part.boneId) ?? new Box3();
    box.union(part.geometry.boundingBox);
    perBone.set(part.boneId, box);
  }
  const whole = new Box3();
  for (const box of perBone.values()) whole.union(box);
  if (whole.isEmpty()) throw new Error(`No mesh for ${boneIds.join(', ')}`);
  if (focus === 'whole') return whole;
  const boxes = [...perBone.values()];
  const contact = new Box3();
  for (let i = 0; i < boxes.length; i++) {
    for (let j = i + 1; j < boxes.length; j++) {
      const a = boxes[i];
      const b = boxes[j];
      if (a === undefined || b === undefined) continue;
      const overlap = a.clone().intersect(b);
      // Bones lying side by side (tibia and fibula, radius and ulna) overlap along their length;
      // that is not where the joint is, so such overlaps are left out.
      const shorter = Math.min(a.getSize(new Vector3()).y, b.getSize(new Vector3()).y);
      if (!overlap.isEmpty() && overlap.getSize(new Vector3()).y < shorter * 0.5) contact.union(overlap);
    }
  }
  return contact.isEmpty() ? whole : contact;
}

const tool = {
  boneIds: [...new Set(bones.map((b) => b.boneId ?? ''))],
  /** Visible pixels of the target from a view: how well the view shows it. */
  coverage(boneIds: string[], focus: Focus, view: BoneView): number {
    const size = { width: 200, height: 250, padding: 1.4 };
    const camera = stage.camera(frameBounds(boneIds, focus), view, rightIsNegativeX, size, MIN_HALF_HEIGHT);
    const wanted = new Set(boneIds);
    for (const { part, mesh } of meshes) mesh.material = isTarget(part, wanted) ? TARGET_ID : OTHER_ID;
    return stage.countTarget(camera, size.width, size.height);
  },
  image(boneIds: string[], focus: Focus, view: BoneView, width: number, height: number, padding: number): string {
    const wanted = new Set(boneIds);
    for (const { part, mesh } of meshes) mesh.material = isTarget(part, wanted) ? HIGHLIGHT : CONTEXT;
    const camera = stage.camera(frameBounds(boneIds, focus), view, rightIsNegativeX, { width, height, padding }, MIN_HALF_HEIGHT);
    return stage.picture(camera, width, height);
  },
};

(window as unknown as { boneTool: typeof tool }).boneTool = tool;
