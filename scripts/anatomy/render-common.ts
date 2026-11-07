/**
 * Shared by the build-time picture pages (render-bones-page.ts, render-nerves-page.ts): the scene
 * with its lights, the display and ID renderers, the skeleton of all four regional models, and the
 * camera that frames a box from one of the four views.
 */
import { AmbientLight, Box3, Color, DirectionalLight, LinearSRGBColorSpace, MeshBasicMaterial, NoToneMapping, OrthographicCamera, Scene, Vector3, WebGLRenderer } from 'three';
import type { RegionId } from '../../src/data/types';
import { loadAnatomyModel, type ModelPart } from '../../src/viewer/model';

export type View = 'anterior' | 'posterior' | 'lateral' | 'medial' | 'inferior';

const REGIONS: RegionId[] = ['head-neck', 'trunk-pelvis', 'upper-limb', 'lower-limb'];

/** Bones and muscles of all four regional models, each once (the models overlap at their borders). */
export async function loadBody(): Promise<{ bones: ModelPart[]; muscles: ModelPart[] }> {
  const models = await Promise.all(REGIONS.map((region) => loadAnatomyModel(region)));
  const seen = new Set<string>();
  const bones: ModelPart[] = [];
  const muscles: ModelPart[] = [];
  for (const part of models.flatMap((model) => model.parts)) {
    const key = `${part.kind}|${part.name}|${part.side}`;
    if (seen.has(key)) continue;
    seen.add(key);
    if (part.kind === 'bone' && part.boneId !== null && !/muscle/i.test(part.name)) bones.push(part);
    if (part.kind === 'muscle' && part.muscleId !== null) muscles.push(part);
  }
  return { bones, muscles };
}

/** Which way the body's right side lies (right-side bones sit on one side of the midline), and the skeleton's bounds. */
export function skeletonFrame(bones: ModelPart[]): { rightIsNegativeX: boolean; bounds: Box3 } {
  const rightBones = bones.filter((b) => b.side === 'right');
  const rightCentre = rightBones.reduce((sum, b) => sum + (b.geometry.boundingBox?.getCenter(new Vector3()).x ?? 0), 0) / Math.max(1, rightBones.length);
  const bounds = new Box3();
  for (const b of bones) if (b.geometry.boundingBox) bounds.union(b.geometry.boundingBox);
  return { rightIsNegativeX: rightCentre < bounds.getCenter(new Vector3()).x, bounds };
}

export const TARGET_ID = new MeshBasicMaterial({ color: new Color().setRGB(1, 0, 0, LinearSRGBColorSpace) });
export const OTHER_ID = new MeshBasicMaterial({ color: new Color().setRGB(0, 0, 1, LinearSRGBColorSpace) });

export function createStage() {
  const scene = new Scene();
  scene.add(new AmbientLight(0xffffff, 1.0));
  const key = new DirectionalLight(0xffffff, 2.0);
  const fill = new DirectionalLight(0xffffff, 0.7);
  scene.add(key, fill);
  const displayCanvas = document.getElementById('display') as HTMLCanvasElement;
  const display = new WebGLRenderer({ canvas: displayCanvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
  const ids = new WebGLRenderer({ canvas: document.getElementById('ids') as HTMLCanvasElement, antialias: false, alpha: true, preserveDrawingBuffer: true });
  for (const renderer of [display, ids]) renderer.setClearColor(0x000000, 0);
  ids.toneMapping = NoToneMapping;
  ids.outputColorSpace = LinearSRGBColorSpace;

  /** Direction from the target to the camera; lateral is the body's right, inferior looks up at the sole. */
  const direction = (view: View, rightIsNegativeX: boolean): Vector3 => {
    const side = rightIsNegativeX ? -1 : 1;
    if (view === 'inferior') return new Vector3(0, -1, 0);
    if (view === 'anterior') return new Vector3(0, 0, 1);
    if (view === 'posterior') return new Vector3(0, 0, -1);
    if (view === 'lateral') return new Vector3(side, 0, 0);
    return new Vector3(-side, 0, 0);
  };

  return {
    scene,
    /** An orthographic camera that frames the box from the view, at least minHalfHeight tall, and lights placed to match. */
    camera(bounds: Box3, view: View, rightIsNegativeX: boolean, size: { width: number; height: number; padding: number }, minHalfHeight: number): OrthographicCamera {
      const centre = bounds.getCenter(new Vector3());
      const extent = bounds.getSize(new Vector3());
      const dir = direction(view, rightIsNegativeX);
      // Seen from below, the front of the body is up in the picture; otherwise the head is.
      const up = view === 'inferior' ? new Vector3(0, 0, 1) : new Vector3(0, 1, 0);
      const tall = view === 'inferior' ? extent.z : extent.y;
      // Width seen from this direction: z for side views, x otherwise.
      const across = Math.abs(dir.x) > 0 ? extent.z : extent.x;
      const aspect = size.width / size.height;
      const halfHeight = Math.max(tall / 2, across / 2 / aspect, minHalfHeight / size.padding) * size.padding;
      const halfWidth = halfHeight * aspect;
      // From below, everything above the target (the rest of the body) is cut away.
      const far = view === 'inferior' ? 1500 + extent.y / 2 + 5 : 4000;
      const camera = new OrthographicCamera(-halfWidth, halfWidth, halfHeight, -halfHeight, 1, far);
      camera.position.copy(centre).addScaledVector(dir, 1500);
      camera.up.copy(up);
      camera.lookAt(centre);
      key.position.copy(centre).add(new Vector3(-0.4, 1, 0.6).multiplyScalar(400)).addScaledVector(dir, 300);
      fill.position.copy(centre).add(new Vector3(0.6, -0.3, 0.4).multiplyScalar(300)).addScaledVector(dir, 200);
      return camera;
    },
    /** Pixels drawn with TARGET_ID in an ID render: how much of the target a view shows. */
    countTarget(camera: OrthographicCamera, width: number, height: number): number {
      ids.setSize(width, height, false);
      ids.render(scene, camera);
      const gl = ids.getContext();
      const pixels = new Uint8Array(width * height * 4);
      gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
      let count = 0;
      for (let i = 0; i < pixels.length; i += 4) if ((pixels[i] as number) > 200 && (pixels[i + 3] as number) > 0) count++;
      return count;
    },
    /** The picture as a WebP data URL. */
    picture(camera: OrthographicCamera, width: number, height: number): string {
      display.setSize(width, height, false);
      display.render(scene, camera);
      return displayCanvas.toDataURL('image/webp', 0.84);
    },
  };
}
