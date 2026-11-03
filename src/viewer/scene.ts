import {
  AmbientLight,
  Box3,
  Color,
  DirectionalLight,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PerspectiveCamera,
  Raycaster,
  Scene,
  Vector2,
  Vector3,
  WebGLRenderer,
} from 'three';
import type { RegionId } from '../data/types';
import type { AnatomyModel, ModelPart } from './model';

export type CameraView = 'anterior' | 'posterior' | 'lateral' | 'medial' | 'inferior';
export type DisplayMode = 'muscle' | 'attachments';

export const COLORS = {
  bone: '#e9dfc9',
  muscle: '#c7372f',
  otherMuscle: '#c9958c',
  origin: '#e53935',
  insertion: '#1e6fd9',
} as const;

/** Direction from the target towards the camera (model right = -x, front = +z, up = +y). */
const VIEW_DIRECTIONS: Record<CameraView, Vector3> = {
  anterior: new Vector3(-0.25, 0.1, 1).normalize(),
  posterior: new Vector3(-0.25, 0.1, -1).normalize(),
  lateral: new Vector3(-1, 0.1, 0.15).normalize(),
  medial: new Vector3(1, 0.1, 0.15).normalize(),
  inferior: new Vector3(-0.15, -1, 0.35).normalize(),
};

/** Views offered for each region. Medial views hide the opposite limb, which would block them. */
export const REGION_VIEWS: Record<RegionId, CameraView[]> = {
  'upper-limb': ['anterior', 'posterior', 'lateral', 'medial'],
  'lower-limb': ['anterior', 'posterior', 'lateral', 'medial', 'inferior'],
  'trunk-pelvis': ['anterior', 'posterior', 'lateral', 'inferior'],
  'head-neck': ['anterior', 'posterior', 'lateral'],
};

export const VIEW_LABELS: Record<CameraView, string> = {
  anterior: 'Front',
  posterior: 'Back',
  lateral: 'Side',
  medial: 'Inner',
  inferior: 'Below',
};

export interface SceneOptions {
  muscleId: string;
  mode: DisplayMode;
  showOtherMuscles: boolean;
}

function material(color: string, opacity = 1): MeshStandardMaterial {
  return new MeshStandardMaterial({
    color: new Color(color),
    roughness: 0.65,
    metalness: 0,
    transparent: opacity < 1,
    opacity,
    depthWrite: opacity === 1,
  });
}

/**
 * Three.js scene for one muscle: the skeleton, the selected muscle highlighted, other muscles
 * ghosted, and (in attachment mode) origin areas in red and insertion areas in blue.
 */
export class AnatomyScene {
  readonly renderer: WebGLRenderer;
  readonly camera = new PerspectiveCamera(30, 1, 1, 2000);
  private readonly scene = new Scene();
  private readonly meshes: { part: ModelPart; mesh: Mesh }[];
  private readonly materials = {
    bone: material(COLORS.bone),
    muscle: material(COLORS.muscle),
    otherMuscle: material(COLORS.otherMuscle, 0.22),
    otherMuscleSolid: material(COLORS.otherMuscle),
    ghostMuscle: material(COLORS.muscle, 0.18),
    origin: material(COLORS.origin),
    insertion: material(COLORS.insertion),
  };
  private options: SceneOptions;
  /** True for medial views: the opposite (left) half of the body is hidden so it does not block the view. */
  private hideLeftSide = false;

  constructor(canvas: HTMLCanvasElement, model: AnatomyModel, options: SceneOptions, preserveDrawingBuffer = false) {
    this.renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer });
    this.renderer.setClearColor(0x000000, 0);
    this.materials.origin.polygonOffset = true;
    this.materials.origin.polygonOffsetFactor = -2;
    this.materials.insertion.polygonOffset = true;
    this.materials.insertion.polygonOffsetFactor = -2;
    this.scene.add(new AmbientLight(0xffffff, 1.1));
    const headlight = new DirectionalLight(0xffffff, 2.2);
    headlight.position.set(0.3, 0.6, 1);
    this.camera.add(headlight);
    this.scene.add(this.camera);
    this.meshes = model.parts.map((part) => {
      const mesh = new Mesh(part.geometry, this.materials.bone);
      mesh.userData.part = part;
      this.scene.add(mesh);
      return { part, mesh };
    });
    this.options = options;
    this.apply();
  }

  setOptions(options: SceneOptions): void {
    this.options = options;
    this.apply();
  }

  /** Assign materials and visibility for the current options. */
  private apply(): void {
    const { muscleId, mode, showOtherMuscles } = this.options;
    for (const { part, mesh } of this.meshes) {
      const selected = part.muscleId === muscleId;
      if (this.hideLeftSide && part.side === 'left') {
        mesh.visible = false;
        continue;
      }
      if (part.kind === 'bone') {
        mesh.visible = true;
        mesh.material = this.materials.bone;
        mesh.renderOrder = 0;
      } else if (part.kind === 'attachment') {
        mesh.visible = mode === 'attachments' && selected;
        mesh.material = part.attachment === 'origin' ? this.materials.origin : this.materials.insertion;
        mesh.renderOrder = 1;
      } else if (selected) {
        mesh.visible = true;
        mesh.material = mode === 'attachments' ? this.materials.ghostMuscle : this.materials.muscle;
        mesh.renderOrder = mode === 'attachments' ? 3 : 1;
      } else {
        mesh.visible = showOtherMuscles && mode === 'muscle';
        mesh.material = this.materials.otherMuscle;
        mesh.renderOrder = 2;
      }
    }
  }

  /** Bounding box of what the current mode is about: the muscle, or its attachment areas. */
  focusBox(): Box3 {
    const { muscleId, mode } = this.options;
    const box = new Box3();
    for (const { part } of this.meshes) {
      const wanted = mode === 'attachments' ? part.kind === 'attachment' : part.kind === 'muscle';
      if (part.muscleId === muscleId && wanted && part.geometry.boundingBox) box.union(part.geometry.boundingBox);
    }
    return box;
  }

  /** Place the camera so the selected muscle fills the view, with some surrounding context. */
  frame(view: CameraView, aspect: number, padding = 1.35): Vector3 {
    this.hideLeftSide = view === 'medial';
    this.apply();
    const box = this.focusBox();
    const center = box.getCenter(new Vector3());
    const size = box.getSize(new Vector3());
    const radius = Math.max(size.length() / 2, 9) * padding;
    const fov = (this.camera.fov * Math.PI) / 180;
    const fitHeight = radius / Math.sin(fov / 2);
    const fitWidth = radius / Math.sin(Math.atan(Math.tan(fov / 2) * aspect));
    const distance = Math.max(fitHeight, fitWidth);
    this.camera.aspect = aspect;
    this.camera.position.copy(center).addScaledVector(VIEW_DIRECTIONS[view], distance);
    this.camera.near = Math.max(1, distance - radius * 3);
    this.camera.far = distance + radius * 3;
    this.camera.lookAt(center);
    this.camera.updateProjectionMatrix();
    return center;
  }

  setSize(width: number, height: number, pixelRatio: number): void {
    this.renderer.setPixelRatio(pixelRatio);
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  render(): void {
    this.renderer.render(this.scene, this.camera);
  }

  /**
   * Fraction of the canvas covered by the selected muscle (muscle mode) or its attachment areas
   * (attachment mode), accounting for occlusion. Used to pick the most informative views.
   */
  coverage(): number {
    const white = new MeshBasicMaterial({ color: 0xffffff });
    const black = new MeshBasicMaterial({ color: 0x000000 });
    const { muscleId, mode } = this.options;
    for (const { part, mesh } of this.meshes) {
      const target = part.muscleId === muscleId && (mode === 'muscle' ? part.kind === 'muscle' : part.kind === 'attachment');
      const hidden = this.hideLeftSide && part.side === 'left';
      mesh.visible = !hidden && (target || part.kind === 'bone' || (mode === 'muscle' && part.kind === 'muscle' && part.muscleId === muscleId));
      mesh.material = target ? white : black;
    }
    this.renderer.setClearColor(0x000000, 1);
    this.render();
    const gl = this.renderer.getContext();
    const width = gl.drawingBufferWidth;
    const height = gl.drawingBufferHeight;
    const pixels = new Uint8Array(width * height * 4);
    gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
    let covered = 0;
    for (let i = 0; i < pixels.length; i += 4) if ((pixels[i] as number) > 127) covered++;
    this.renderer.setClearColor(0x000000, 0);
    white.dispose();
    black.dispose();
    this.apply();
    return covered / (width * height);
  }

  /** The muscle under a point given in normalised device coordinates, if any. */
  pickMuscle(ndc: Vector2): string | null {
    const raycaster = new Raycaster();
    raycaster.setFromCamera(ndc, this.camera);
    const candidates = this.meshes.filter(({ part, mesh }) => mesh.visible && part.kind !== 'attachment').map(({ mesh }) => mesh);
    for (const hit of raycaster.intersectObjects(candidates, false)) {
      const part = hit.object.userData.part as ModelPart;
      if (part.kind === 'bone') return null;
      return part.muscleId;
    }
    return null;
  }

  dispose(): void {
    for (const m of Object.values(this.materials)) m.dispose();
    this.renderer.dispose();
  }
}

export function muscleHasModel(model: AnatomyModel, muscleId: string): boolean {
  return model.parts.some((part) => part.kind === 'muscle' && part.muscleId === muscleId);
}
