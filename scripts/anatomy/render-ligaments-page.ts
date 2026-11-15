/**
 * Build-time page driven by render-ligaments.mjs: the whole skeleton with every ligament, capsule,
 * meniscus and disc of the ligament model. One structure is drawn in colour, the others as faint
 * see-through context; when bone hides most of it (cruciates, menisci, interosseous ligaments) the
 * bones are made see-through too.
 */
import { Box3, Color, Mesh, MeshStandardMaterial, Vector3, type Material } from 'three';
import { loadLigamentModel, type ModelPart } from '../../src/viewer/model';
import { createStage, loadBody, OTHER_ID, skeletonFrame, TARGET_ID, type View } from './render-common';

const BONE = new MeshStandardMaterial({ color: new Color('#e9dfc9'), roughness: 0.75, metalness: 0 });
const GLASS_BONE = new MeshStandardMaterial({ color: new Color('#e9dfc9'), roughness: 0.75, metalness: 0, transparent: true, opacity: 0.28, depthWrite: false });
const LIGAMENT = new MeshStandardMaterial({ color: new Color('#0f9d8f'), roughness: 0.45, metalness: 0, emissive: new Color('#05463f') });
/** Other ligaments are context only: see-through, so capsules and retinacula never hide the one in colour. */
const OTHER_LIGAMENT = new MeshStandardMaterial({ color: new Color('#9fb0b8'), roughness: 0.7, metalness: 0, transparent: true, opacity: 0.35, depthWrite: false });

const { bones } = await loadBody();
const ligamentParts = (await loadLigamentModel()).parts;
const { rightIsNegativeX, bounds: skeletonBounds } = skeletonFrame(bones);
/** Small ligaments are framed with at least this much of the body around them, so the joint is recognisable. */
const MIN_HALF_HEIGHT = skeletonBounds.getSize(new Vector3()).y * 0.05;

const stage = createStage();
const boneMeshes = bones.map((part) => ({ part, mesh: new Mesh(part.geometry, BONE) }));
const ligamentMeshes = ligamentParts.map((part) => ({ part, mesh: new Mesh(part.geometry, OTHER_LIGAMENT) }));
stage.scene.add(...boneMeshes.map((b) => b.mesh), ...ligamentMeshes.map((l) => l.mesh));

const isTarget = (part: ModelPart, id: string) => part.ligamentId === id;

/** Assign materials; in a medial view the left half of the body is hidden, as it would block the view. */
function show(id: string, view: View, materials: { target: Material; otherLigament: Material; bone: Material; hideOthers?: boolean; hideBones?: boolean }): Box3 {
  const hideLeft = view === 'medial';
  const box = new Box3();
  for (const { part, mesh } of boneMeshes) {
    mesh.visible = !materials.hideBones && !(hideLeft && part.side === 'left');
    mesh.material = materials.bone;
  }
  for (const { part, mesh } of ligamentMeshes) {
    const target = isTarget(part, id);
    mesh.visible = target || !materials.hideOthers;
    mesh.material = target ? materials.target : materials.otherLigament;
    // See-through bones write no depth, so the ligament drawn after them shows in front.
    mesh.renderOrder = target ? 2 : 0;
    if (target && part.geometry.boundingBox !== null) box.union(part.geometry.boundingBox);
  }
  if (box.isEmpty()) throw new Error(`No mesh for ligament "${id}"`);
  return box;
}

const MEASURE = { width: 200, height: 250, padding: 1.4 };

const tool = {
  ligamentIds: [...new Set(ligamentParts.map((p) => p.ligamentId ?? ''))],
  /** Pixels of the ligament visible past the bones from a view, and how many it covers with nothing in front. */
  measure(id: string, view: View): { visible: number; alone: number } {
    const box = show(id, view, { target: TARGET_ID, otherLigament: OTHER_ID, bone: OTHER_ID, hideOthers: true });
    const camera = stage.camera(box, view, rightIsNegativeX, MEASURE, MIN_HALF_HEIGHT);
    const visible = stage.countTarget(camera, MEASURE.width, MEASURE.height);
    show(id, view, { target: TARGET_ID, otherLigament: OTHER_ID, bone: OTHER_ID, hideOthers: true, hideBones: true });
    return { visible, alone: stage.countTarget(camera, MEASURE.width, MEASURE.height) };
  },
  image(id: string, view: View, width: number, height: number, padding: number, xray: boolean): string {
    // Deep structures (cruciates, menisci, interosseous ligaments): the bones become see-through too.
    const box = show(id, view, { target: LIGAMENT, otherLigament: OTHER_LIGAMENT, bone: xray ? GLASS_BONE : BONE });
    for (const { mesh } of boneMeshes) mesh.renderOrder = xray ? 1 : 0;
    return stage.picture(stage.camera(box, view, rightIsNegativeX, { width, height, padding }, MIN_HALF_HEIGHT), width, height);
  },
};

(window as unknown as { ligamentTool: typeof tool }).ligamentTool = tool;
