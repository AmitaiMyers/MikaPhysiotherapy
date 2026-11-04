/**
 * Build-time page driven by render-body.mjs: loads all four regional models together (they share
 * one coordinate space) and renders the full body from the front and the back, as a shaded image
 * for display and as an "ID map" where every muscle and bone has its own flat colour for tapping.
 */
import { AmbientLight, Box3, Color, DirectionalLight, LinearSRGBColorSpace, Mesh, MeshBasicMaterial, MeshStandardMaterial, NoToneMapping, OrthographicCamera, Scene, Vector3, WebGLRenderer } from 'three';
import { MUSCLES } from '../../src/data';
import type { RegionId } from '../../src/data/types';
import { loadAnatomyModel, type ModelPart } from '../../src/viewer/model';

export type BodyView = 'front' | 'back';
export type BodyLayer = 'superficial' | 'deep' | 'skeleton';

interface Target {
  kind: 'muscle' | 'bone';
  id: string;
}

const REGIONS: RegionId[] = ['head-neck', 'trunk-pelvis', 'upper-limb', 'lower-limb'];
const models = await Promise.all(REGIONS.map((region) => loadAnatomyModel(region)));
const parts = models.flatMap((model) => model.parts).filter((part) => part.kind !== 'attachment');

/** Stable list of tappable structures; index + 1 is the colour in the ID map (0 = nothing). */
const targets: Target[] = [];
const targetIndex = new Map<string, number>();
function targetOf(part: ModelPart): number {
  const target: Target | null = part.kind === 'muscle' && part.muscleId !== null ? { kind: 'muscle', id: part.muscleId } : part.kind === 'bone' && part.boneId !== null ? { kind: 'bone', id: part.boneId } : null;
  if (target === null) return 0;
  const key = `${target.kind}:${target.id}`;
  let index = targetIndex.get(key);
  if (index === undefined) {
    targets.push(target);
    index = targets.length;
    targetIndex.set(key, index);
  }
  return index;
}

const isBoneMesh = (part: ModelPart) => part.kind === 'bone' && !/muscle/i.test(part.name);

function hashHue(text: string): number {
  let hash = 0;
  for (const char of text) hash = (hash * 31 + char.charCodeAt(0)) | 0;
  return ((hash >>> 0) % 1000) / 1000;
}

/** Muscles get slightly different shades so neighbours can be told apart. */
function displayMaterial(part: ModelPart): MeshStandardMaterial {
  if (part.kind === 'muscle') {
    const color = new Color('#b8463c');
    color.offsetHSL((hashHue(part.muscleId ?? part.name) - 0.5) * 0.03, 0, (hashHue(`${part.name}l`) - 0.5) * 0.12);
    return new MeshStandardMaterial({ color, roughness: 0.62, metalness: 0 });
  }
  return new MeshStandardMaterial({ color: isBoneMesh(part) ? '#ece2cd' : '#d9cfc0', roughness: 0.78, metalness: 0 });
}

const scene = new Scene();
scene.add(new AmbientLight(0xffffff, 1.1));
const key = new DirectionalLight(0xffffff, 1.9);
scene.add(key);
const fill = new DirectionalLight(0xffffff, 0.6);
scene.add(fill);

const meshes = parts.map((part) => {
  const index = targetOf(part);
  const mesh = new Mesh(part.geometry, displayMaterial(part));
  const r = index & 0xff;
  const g = (index >> 8) & 0xff;
  // Exact colours: specified and output in linear space, so no sRGB conversion changes them.
  const idMaterial = new MeshBasicMaterial({ color: new Color().setRGB(r / 255, g / 255, 0, LinearSRGBColorSpace) });
  scene.add(mesh);
  return { part, mesh, index, display: mesh.material, idMaterial };
});

const bounds = new Box3();
for (const { part } of meshes) if (part.geometry.boundingBox) bounds.union(part.geometry.boundingBox);
const center = bounds.getCenter(new Vector3());
const size = bounds.getSize(new Vector3());

const displayCanvas = document.getElementById('display') as HTMLCanvasElement;
const idCanvas = document.getElementById('ids') as HTMLCanvasElement;
const displayRenderer = new WebGLRenderer({ canvas: displayCanvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
const idRenderer = new WebGLRenderer({ canvas: idCanvas, antialias: false, alpha: true, preserveDrawingBuffer: true });
for (const renderer of [displayRenderer, idRenderer]) renderer.setClearColor(0x000000, 0);
idRenderer.toneMapping = NoToneMapping;
idRenderer.outputColorSpace = LinearSRGBColorSpace;

function camera(view: BodyView, width: number, height: number): OrthographicCamera {
  const aspect = width / height;
  const halfHeight = (size.y / 2) * 1.03;
  const halfWidth = Math.max(halfHeight * aspect, (size.x / 2) * 1.03);
  const h = halfWidth / aspect;
  const cam = new OrthographicCamera(-halfWidth, halfWidth, h, -h, 1, 1000);
  const direction = view === 'front' ? 1 : -1;
  cam.position.set(center.x, center.y, center.z + direction * 400);
  cam.lookAt(center);
  key.position.set(center.x - 60, center.y + 120, center.z + direction * 200);
  fill.position.set(center.x + 80, center.y - 40, center.z + direction * 150);
  return cam;
}

function setVisibility(layer: BodyLayer, hiddenMuscles: Set<string>): void {
  for (const { part, mesh } of meshes) {
    if (part.kind === 'muscle') mesh.visible = layer !== 'skeleton' && !(layer === 'deep' && part.muscleId !== null && hiddenMuscles.has(part.muscleId));
    else mesh.visible = layer === 'skeleton' ? isBoneMesh(part) : true;
  }
}

function renderIds(view: BodyView, width: number, height: number): Uint8Array {
  for (const m of meshes) m.mesh.material = m.idMaterial;
  idRenderer.setSize(width, height, false);
  idRenderer.render(scene, camera(view, width, height));
  for (const m of meshes) m.mesh.material = m.display;
  const gl = idRenderer.getContext();
  const pixels = new Uint8Array(width * height * 4);
  gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
  return pixels;
}

/** Muscles with at least this many visible pixels in the superficial view are peeled away in the deep view. */
const PEEL_MIN_PIXELS = 40;
/** Muscles the app data places below the surface stay in the deep view even where they show. */
const NEVER_PEELED = new Set(MUSCLES.filter((m) => m.layer !== undefined && !['Superficial', 'Layer 1'].includes(m.layer)).map((m) => m.id));

const tool = {
  targets,
  /** Muscle ids visible from the front or back in the superficial layer. */
  superficialMuscles(width: number, height: number): string[] {
    setVisibility('superficial', new Set());
    const counts = new Map<number, number>();
    for (const view of ['front', 'back'] as const) {
      const pixels = renderIds(view, width, height);
      for (let i = 0; i < pixels.length; i += 4) {
        if ((pixels[i + 3] as number) === 0) continue;
        const index = (pixels[i] as number) + (pixels[i + 1] as number) * 256;
        counts.set(index, (counts.get(index) ?? 0) + 1);
      }
    }
    return [...counts.entries()]
      .filter(([index, count]) => index > 0 && count >= PEEL_MIN_PIXELS && targets[index - 1]?.kind === 'muscle')
      .map(([index]) => targets[index - 1]?.id ?? '')
      .filter((id) => !NEVER_PEELED.has(id));
  },
  render(view: BodyView, layer: BodyLayer, hidden: string[], width: number, height: number): { display: string; ids: string; present: number[] } {
    setVisibility(layer, new Set(hidden));
    displayRenderer.setSize(width, height, false);
    displayRenderer.render(scene, camera(view, width, height));
    const display = displayCanvas.toDataURL('image/webp', 0.86);
    const pixels = renderIds(view, width, height);
    // Copy into a 2D canvas (flipping rows: WebGL reads bottom-up) to export a lossless PNG.
    const out = document.createElement('canvas');
    out.width = width;
    out.height = height;
    const context = out.getContext('2d');
    if (context === null) throw new Error('No 2D context');
    const image = context.createImageData(width, height);
    const present = new Set<number>();
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const from = ((height - 1 - y) * width + x) * 4;
        const to = (y * width + x) * 4;
        const opaque = (pixels[from + 3] as number) > 0;
        image.data[to] = opaque ? (pixels[from] as number) : 0;
        image.data[to + 1] = opaque ? (pixels[from + 1] as number) : 0;
        image.data[to + 2] = 0;
        image.data[to + 3] = 255;
        if (opaque) present.add((pixels[from] as number) + (pixels[from + 1] as number) * 256);
      }
    }
    context.putImageData(image, 0, 0);
    return { display, ids: out.toDataURL('image/png'), present: [...present].filter((i) => i > 0) };
  },
};

(window as unknown as { bodyTool: typeof tool }).bodyTool = tool;
