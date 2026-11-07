/**
 * Build-time page driven by render-bones.mjs: loads the skeleton of all four regional models (one
 * coordinate space, duplicates removed) and renders one bone, or the bones of one joint, highlighted
 * against the rest of the skeleton. The body's right side is used, as in the muscle images.
 */
import { AmbientLight, Box3, Color, DirectionalLight, LinearSRGBColorSpace, Mesh, MeshBasicMaterial, MeshStandardMaterial, NoToneMapping, OrthographicCamera, Scene, Vector3, WebGLRenderer } from 'three';
import type { RegionId } from '../../src/data/types';
import { loadAnatomyModel, type ModelPart } from '../../src/viewer/model';

export type BoneView = 'anterior' | 'posterior' | 'lateral' | 'medial';

const REGIONS: RegionId[] = ['head-neck', 'trunk-pelvis', 'upper-limb', 'lower-limb'];
const models = await Promise.all(REGIONS.map((region) => loadAnatomyModel(region)));

/** Skeleton meshes, each once (the regional models overlap at their borders). */
const seen = new Set<string>();
const bones: ModelPart[] = [];
for (const part of models.flatMap((model) => model.parts)) {
  if (part.kind !== 'bone' || part.boneId === null || /muscle/i.test(part.name)) continue;
  const key = `${part.name}|${part.side}`;
  if (seen.has(key)) continue;
  seen.add(key);
  bones.push(part);
}

const HIGHLIGHT = new MeshStandardMaterial({ color: new Color('#f4ead3'), roughness: 0.6, metalness: 0, emissive: new Color('#3a3226') });
const CONTEXT = new MeshStandardMaterial({ color: new Color('#5d6870'), roughness: 0.85, metalness: 0 });
const TARGET_ID = new MeshBasicMaterial({ color: new Color().setRGB(1, 0, 0, LinearSRGBColorSpace) });
const OTHER_ID = new MeshBasicMaterial({ color: new Color().setRGB(0, 0, 1, LinearSRGBColorSpace) });

const scene = new Scene();
scene.add(new AmbientLight(0xffffff, 1.0));
const key = new DirectionalLight(0xffffff, 2.0);
const fill = new DirectionalLight(0xffffff, 0.7);
scene.add(key, fill);
const meshes = bones.map((part) => {
  const mesh = new Mesh(part.geometry, CONTEXT);
  scene.add(mesh);
  return { part, mesh };
});

const displayCanvas = document.getElementById('display') as HTMLCanvasElement;
const idCanvas = document.getElementById('ids') as HTMLCanvasElement;
const display = new WebGLRenderer({ canvas: displayCanvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
const ids = new WebGLRenderer({ canvas: idCanvas, antialias: false, alpha: true, preserveDrawingBuffer: true });
for (const renderer of [display, ids]) renderer.setClearColor(0x000000, 0);
ids.toneMapping = NoToneMapping;
ids.outputColorSpace = LinearSRGBColorSpace;

/** The right side of the body, plus midline bones. */
const isTarget = (part: ModelPart, boneIds: Set<string>) => part.boneId !== null && boneIds.has(part.boneId) && part.side !== 'left';

/** Direction from the target to the camera for each view; lateral is the body's right (−x in this model space). */
function direction(view: BoneView, rightIsNegativeX: boolean): Vector3 {
  const side = rightIsNegativeX ? -1 : 1;
  if (view === 'anterior') return new Vector3(0, 0, 1);
  if (view === 'posterior') return new Vector3(0, 0, -1);
  if (view === 'lateral') return new Vector3(side, 0, 0);
  return new Vector3(-side, 0, 0);
}

/** Right-side bones lie on one side of the midline; that sign tells which way "lateral" points. */
const rightBones = bones.filter((b) => b.side === 'right');
const rightCentre = rightBones.reduce((sum, b) => sum + (b.geometry.boundingBox?.getCenter(new Vector3()).x ?? 0), 0) / Math.max(1, rightBones.length);
const allBounds = new Box3();
for (const b of bones) if (b.geometry.boundingBox) allBounds.union(b.geometry.boundingBox);
const midline = allBounds.getCenter(new Vector3()).x;
const rightIsNegativeX = rightCentre < midline;
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

function prepare(boneIds: string[], focus: Focus, view: BoneView, width: number, height: number, padding: number): OrthographicCamera {
  const wanted = new Set(boneIds);
  for (const { part, mesh } of meshes) mesh.material = isTarget(part, wanted) ? HIGHLIGHT : CONTEXT;
  const bounds = frameBounds(boneIds, focus);
  const centre = bounds.getCenter(new Vector3());
  const size = bounds.getSize(new Vector3());
  const dir = direction(view, rightIsNegativeX);
  // Width seen from this direction: x for front/back, z for side views.
  const across = Math.abs(dir.z) > 0 ? size.x : size.z;
  const aspect = width / height;
  const halfHeight = Math.max(size.y / 2, across / 2 / aspect, MIN_HALF_HEIGHT / padding) * padding;
  const halfWidth = halfHeight * aspect;
  const camera = new OrthographicCamera(-halfWidth, halfWidth, halfHeight, -halfHeight, 1, 4000);
  camera.position.copy(centre).addScaledVector(dir, 1500);
  camera.lookAt(centre);
  key.position.copy(centre).add(new Vector3(-0.4, 1, 0.6).multiplyScalar(400)).addScaledVector(dir, 300);
  fill.position.copy(centre).add(new Vector3(0.6, -0.3, 0.4).multiplyScalar(300)).addScaledVector(dir, 200);
  return camera;
}

const tool = {
  boneIds: [...new Set(bones.map((b) => b.boneId ?? ''))],
  /** Visible pixels of the target from a view: how well the view shows it. */
  coverage(boneIds: string[], focus: Focus, view: BoneView): number {
    const width = 200;
    const height = 250;
    const camera = prepare(boneIds, focus, view, width, height, 1.4);
    const wanted = new Set(boneIds);
    for (const { part, mesh } of meshes) mesh.material = isTarget(part, wanted) ? TARGET_ID : OTHER_ID;
    ids.setSize(width, height, false);
    ids.render(scene, camera);
    const gl = ids.getContext();
    const pixels = new Uint8Array(width * height * 4);
    gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
    let count = 0;
    for (let i = 0; i < pixels.length; i += 4) if ((pixels[i] as number) > 200 && (pixels[i + 3] as number) > 0) count++;
    return count;
  },
  image(boneIds: string[], focus: Focus, view: BoneView, width: number, height: number, padding: number): string {
    const camera = prepare(boneIds, focus, view, width, height, padding);
    display.setSize(width, height, false);
    display.render(scene, camera);
    return displayCanvas.toDataURL('image/webp', 0.84);
  },
};

(window as unknown as { boneTool: typeof tool }).boneTool = tool;
