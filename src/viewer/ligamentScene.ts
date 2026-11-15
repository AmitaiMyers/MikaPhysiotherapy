import { AmbientLight, Box3, Color, DirectionalLight, Mesh, MeshStandardMaterial, PerspectiveCamera, Raycaster, Scene, Vector2, Vector3, WebGLRenderer } from 'three';
import type { AnatomyModel, ModelPart } from './model';
import { COLORS, frameCamera, type CameraView } from './scene';

export const LIGAMENT_COLOR = '#0f9d8f';

export interface LigamentSceneOptions {
  ligamentId: string;
  showOtherLigaments: boolean;
  showMuscles: boolean;
  /** Bones drawn see-through, for structures inside a joint (cruciates, menisci, discs). */
  seeThroughBones: boolean;
}

export type PickedStructure = { kind: 'ligament' | 'muscle' | 'bone'; id: string };

function material(color: string, opacity = 1): MeshStandardMaterial {
  return new MeshStandardMaterial({ color: new Color(color), roughness: 0.65, metalness: 0, transparent: opacity < 1, opacity, depthWrite: opacity === 1 });
}

/**
 * Three.js scene for one ligament: the skeleton of its region, the ligament in colour, optionally
 * the other ligaments and the muscles faded, and the bones optionally see-through.
 */
export class LigamentScene {
  readonly renderer: WebGLRenderer;
  readonly camera = new PerspectiveCamera(30, 1, 1, 2000);
  private readonly scene = new Scene();
  private readonly meshes: { part: ModelPart; mesh: Mesh }[] = [];
  private readonly materials = {
    bone: material(COLORS.bone),
    glassBone: material(COLORS.bone, 0.25),
    ligament: material(LIGAMENT_COLOR),
    otherLigament: material('#9fb0b8', 0.4),
    muscle: material(COLORS.otherMuscle, 0.2),
  };
  private options: LigamentSceneOptions;
  /** True for medial views: the left half of the body is hidden so it does not block the view. */
  private hideLeftSide = false;

  constructor(canvas: HTMLCanvasElement, region: AnatomyModel, ligaments: AnatomyModel, options: LigamentSceneOptions) {
    this.renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true });
    this.renderer.setClearColor(0x000000, 0);
    this.materials.ligament.emissive = new Color('#05463f');
    this.scene.add(new AmbientLight(0xffffff, 1.1));
    const headlight = new DirectionalLight(0xffffff, 2.2);
    headlight.position.set(0.3, 0.6, 1);
    this.camera.add(headlight);
    this.scene.add(this.camera);
    const regionBounds = new Box3();
    for (const part of region.parts) if (part.kind === 'bone' && part.geometry.boundingBox !== null) regionBounds.union(part.geometry.boundingBox);
    // Ligaments of other regions would float without their bones: keep those lying in this region's skeleton.
    const nearby = ligaments.parts.filter((part) => part.ligamentId === options.ligamentId || (part.geometry.boundingBox !== null && regionBounds.containsPoint(part.geometry.boundingBox.getCenter(new Vector3()))));
    for (const part of [...region.parts.filter((p) => p.kind !== 'attachment'), ...nearby]) {
      const mesh = new Mesh(part.geometry, this.materials.bone);
      this.scene.add(mesh);
      this.meshes.push({ part, mesh });
    }
    this.options = options;
    this.apply();
  }

  setOptions(options: LigamentSceneOptions): void {
    this.options = options;
    this.apply();
  }

  private apply(): void {
    const { ligamentId, showOtherLigaments, showMuscles, seeThroughBones } = this.options;
    for (const { part, mesh } of this.meshes) {
      const hidden = this.hideLeftSide && part.side === 'left';
      if (part.kind === 'ligament') {
        const target = part.ligamentId === ligamentId;
        mesh.visible = !hidden && (target || showOtherLigaments);
        mesh.material = target ? this.materials.ligament : this.materials.otherLigament;
        // Drawn after see-through bones and faded muscles, so the ligament always shows.
        mesh.renderOrder = target ? 3 : 1;
      } else if (part.kind === 'muscle') {
        mesh.visible = !hidden && showMuscles;
        mesh.material = this.materials.muscle;
        mesh.renderOrder = 2;
      } else {
        mesh.visible = !hidden;
        mesh.material = seeThroughBones ? this.materials.glassBone : this.materials.bone;
        mesh.renderOrder = seeThroughBones ? 2 : 0;
      }
    }
  }

  private focusBox(): Box3 {
    const box = new Box3();
    for (const { part } of this.meshes) if (part.ligamentId === this.options.ligamentId && part.geometry.boundingBox !== null) box.union(part.geometry.boundingBox);
    if (box.isEmpty()) throw new Error(`No 3D mesh for ligament "${this.options.ligamentId}"`);
    return box;
  }

  /** Point the camera at the ligament from one side; small ligaments keep some of the joint around them. */
  frame(view: CameraView, aspect: number): Vector3 {
    this.hideLeftSide = view === 'medial';
    this.apply();
    return frameCamera(this.camera, this.focusBox(), view, aspect, 1.3);
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

  /** The structure under a point (normalised device coordinates): see-through bones let the tap pass. */
  pick(ndc: Vector2): PickedStructure | null {
    const raycaster = new Raycaster();
    raycaster.setFromCamera(ndc, this.camera);
    const candidates = this.meshes.filter(({ part, mesh }) => mesh.visible && !(part.kind === 'bone' && this.options.seeThroughBones));
    const hit = raycaster.intersectObjects(
      candidates.map((c) => c.mesh),
      false,
    )[0];
    if (hit === undefined) return null;
    const part = this.meshes.find((m) => m.mesh === hit.object)?.part;
    if (part === undefined) return null;
    if (part.kind === 'ligament' && part.ligamentId !== null) return { kind: 'ligament', id: part.ligamentId };
    if (part.kind === 'muscle' && part.muscleId !== null) return { kind: 'muscle', id: part.muscleId };
    if (part.kind === 'bone' && part.boneId !== null) return { kind: 'bone', id: part.boneId };
    return null;
  }

  dispose(): void {
    for (const m of Object.values(this.materials)) m.dispose();
    this.renderer.dispose();
  }
}
