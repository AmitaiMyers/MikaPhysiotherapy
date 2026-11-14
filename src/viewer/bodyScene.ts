import { AmbientLight, Box3, Color, DirectionalLight, Mesh, MeshStandardMaterial, PerspectiveCamera, Raycaster, Scene, Vector2, Vector3, WebGLRenderer } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { BodyTarget } from '../data/bodyMap';
import type { CameraPose, MuscleLook } from './explorerState';
import type { ModelPart } from './model';

const COLORS = { muscle: '#b8463c', bone: '#ece2cd', cartilage: '#d9cfc0', selected: '#26c4b5' } as const;

/** Opacity of each look. Glass and ghost muscles write no depth, so what lies beneath shows through. */
const LOOK_OPACITY: Record<MuscleLook, number> = { solid: 1, glass: 0.3, ghost: 0.06, hidden: 0 };
/** Seconds a muscle takes to fade between two looks, and the camera to fly to a new place. */
const FADE_SECONDS = 0.22;
const FLY_SECONDS = 0.45;
const FIELD_OF_VIEW = 30;
/** Share of the half-height of the view that the selection sheet covers at the bottom. */
const SHEET_SHARE = 0.4;

export type BodySide = 'front' | 'back';

interface MuscleMesh {
  muscleId: string;
  mesh: Mesh;
  material: MeshStandardMaterial;
  base: Color;
  opacity: number;
  look: MuscleLook;
}

interface Flight {
  fromPosition: Vector3;
  fromTarget: Vector3;
  toPosition: Vector3;
  toTarget: Vector3;
  elapsed: number;
}

function hashUnit(text: string): number {
  let hash = 0;
  for (const char of text) hash = (hash * 31 + char.charCodeAt(0)) | 0;
  return ((hash >>> 0) % 1000) / 1000;
}

const isBone = (part: ModelPart) => part.kind === 'bone' && !/muscle/i.test(part.name);
const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);

/**
 * The whole body in three.js for the home explorer: skeleton plus right-side muscles, each muscle
 * fading between solid, see-through, ghost and hidden; tap picking; and a camera that orbits, flies
 * to a muscle and remembers where it was. It draws a frame only when something changed.
 */
export class BodyScene {
  private readonly renderer: WebGLRenderer;
  private readonly camera = new PerspectiveCamera(FIELD_OF_VIEW, 1, 1, 4000);
  private readonly controls: OrbitControls;
  private readonly scene = new Scene();
  private readonly muscles: MuscleMesh[] = [];
  private readonly bones: { boneId: string | null; mesh: Mesh }[] = [];
  private readonly boneMaterial = new MeshStandardMaterial({ color: COLORS.bone, roughness: 0.78, metalness: 0 });
  private readonly cartilageMaterial = new MeshStandardMaterial({ color: COLORS.cartilage, roughness: 0.78, metalness: 0 });
  private readonly selectedBoneMaterial = new MeshStandardMaterial({ color: COLORS.selected, roughness: 0.6, metalness: 0, emissive: new Color(COLORS.selected), emissiveIntensity: 0.25 });
  private readonly bounds = new Box3();
  private readonly raycaster = new Raycaster();
  private readonly instantMotion: boolean;
  private flight: Flight | null = null;
  private dirty = true;
  private frame = 0;
  private lastTime = 0;

  constructor(canvas: HTMLCanvasElement, parts: ModelPart[], instantMotion: boolean) {
    this.instantMotion = instantMotion;
    this.renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
    this.renderer.setClearColor(0x000000, 0);
    this.scene.add(new AmbientLight(0xffffff, 1.1));
    const headlight = new DirectionalLight(0xffffff, 2.0);
    headlight.position.set(0.3, 0.6, 1);
    this.camera.add(headlight);
    this.scene.add(this.camera);

    for (const part of parts) {
      if (part.geometry.boundingBox !== null) this.bounds.union(part.geometry.boundingBox);
      if (part.kind === 'muscle' && part.muscleId !== null) {
        // Slightly different shades, so neighbouring muscles can be told apart.
        const base = new Color(COLORS.muscle).offsetHSL((hashUnit(part.muscleId) - 0.5) * 0.03, 0, (hashUnit(`${part.name}l`) - 0.5) * 0.12);
        // Always blend-capable: three.js compiles "opaque" into the shader, so switching it per fade would recompile (and stutter).
        const material = new MeshStandardMaterial({ color: base, roughness: 0.62, metalness: 0, emissive: new Color(COLORS.selected), emissiveIntensity: 0, transparent: true });
        const mesh = new Mesh(part.geometry, material);
        this.muscles.push({ muscleId: part.muscleId, mesh, material, base, opacity: 1, look: 'solid' });
        this.scene.add(mesh);
      } else {
        const mesh = new Mesh(part.geometry, isBone(part) ? this.boneMaterial : this.cartilageMaterial);
        this.bones.push({ boneId: isBone(part) ? part.boneId : null, mesh });
        this.scene.add(mesh);
      }
    }

    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.12;
    const height = this.bounds.getSize(new Vector3()).y;
    this.controls.minDistance = height * 0.12;
    this.controls.maxDistance = height * 4.5;
    this.controls.addEventListener('change', () => {
      this.dirty = true;
    });
    // Taking hold of the model cancels a camera flight in progress.
    this.controls.addEventListener('start', () => {
      this.flight = null;
    });
    this.loop = this.loop.bind(this);
    this.frame = requestAnimationFrame(this.loop);
  }

  /** Muscle ids the model has. */
  muscleIds(): string[] {
    return [...new Set(this.muscles.map((m) => m.muscleId))];
  }

  // ---------- looks ----------

  /** Set how each muscle is drawn; muscles fade to their new look. */
  setLooks(lookOf: (muscleId: string) => MuscleLook): void {
    for (const muscle of this.muscles) {
      muscle.look = lookOf(muscle.muscleId);
      if (this.instantMotion) muscle.opacity = LOOK_OPACITY[muscle.look];
      this.paint(muscle);
    }
    this.dirty = true;
  }

  /** Highlight the selected muscle or bone. */
  setSelected(target: BodyTarget | null): void {
    for (const muscle of this.muscles) {
      const selected = target?.kind === 'muscle' && target.id === muscle.muscleId;
      muscle.material.emissiveIntensity = selected ? 0.55 : 0;
      muscle.material.color.copy(selected ? new Color(COLORS.selected).lerp(muscle.base, 0.45) : muscle.base);
    }
    for (const bone of this.bones) {
      if (bone.boneId === null) continue;
      bone.mesh.material = target?.kind === 'bone' && target.id === bone.boneId ? this.selectedBoneMaterial : this.boneMaterial;
    }
    this.dirty = true;
  }

  /** Apply a muscle's current opacity to its material. Only a fully solid muscle writes depth. */
  private paint(muscle: MuscleMesh): void {
    const solid = muscle.opacity > 0.995;
    muscle.material.opacity = muscle.opacity;
    muscle.material.depthWrite = solid;
    muscle.mesh.visible = muscle.opacity > 0.01;
    // Translucent muscles are drawn after everything solid.
    muscle.mesh.renderOrder = solid ? 0 : 1;
  }

  // ---------- picking ----------

  /**
   * The muscle or bone under a point (normalised device coordinates). Only solid structures can be
   * tapped: see-through, ghost and hidden muscles let the tap through to what lies beneath.
   */
  pick(ndc: Vector2): BodyTarget | null {
    this.raycaster.setFromCamera(ndc, this.camera);
    const muscleOf = new Map<Mesh, string>(this.muscles.filter((m) => m.look === 'solid').map((m) => [m.mesh, m.muscleId]));
    const boneOf = new Map<Mesh, string | null>(this.bones.map((b) => [b.mesh, b.boneId]));
    const hit = this.raycaster.intersectObjects([...muscleOf.keys(), ...boneOf.keys()], false)[0];
    if (hit === undefined) return null;
    const mesh = hit.object as Mesh;
    const muscleId = muscleOf.get(mesh);
    if (muscleId !== undefined) return { kind: 'muscle', id: muscleId };
    const boneId = boneOf.get(mesh);
    return boneId === null || boneId === undefined ? null : { kind: 'bone', id: boneId };
  }

  // ---------- camera ----------

  /** Where the camera sits to show a box from a direction, filling the view. */
  private placement(box: Box3, direction: Vector3, padding: number): { position: Vector3; target: Vector3 } {
    const target = box.getCenter(new Vector3());
    const size = box.getSize(new Vector3());
    const halfFov = (FIELD_OF_VIEW * Math.PI) / 360;
    const forHeight = size.y / 2 / Math.tan(halfFov);
    const forWidth = Math.max(size.x, size.z) / 2 / (Math.tan(halfFov) * this.camera.aspect);
    const distance = Math.max(forHeight, forWidth) * padding + size.z / 2;
    return { position: target.clone().addScaledVector(direction.clone().normalize(), distance), target };
  }

  private flyTo(to: { position: Vector3; target: Vector3 }, instant = false): void {
    if (instant || this.instantMotion) {
      this.flight = null;
      this.camera.position.copy(to.position);
      this.controls.target.copy(to.target);
      this.controls.update();
      this.dirty = true;
      return;
    }
    this.flight = { fromPosition: this.camera.position.clone(), fromTarget: this.controls.target.clone(), toPosition: to.position, toTarget: to.target, elapsed: 0 };
  }

  /** Show the whole body from the front or the back; the camera flies there unless told to jump. */
  showWhole(side: BodySide, instant = false): void {
    this.flyTo(this.placement(this.bounds, new Vector3(0, 0.05, side === 'front' ? 1 : -1), 1.04), instant);
  }

  /** Which side of the body the camera is looking at. */
  facing(): BodySide {
    return this.camera.position.z >= this.controls.target.z ? 'front' : 'back';
  }

  /** Fly to a muscle, keeping the direction the camera is looking from. */
  showMuscle(muscleId: string): void {
    const box = new Box3();
    for (const muscle of this.muscles) if (muscle.muscleId === muscleId && muscle.mesh.geometry.boundingBox !== null) box.union(muscle.mesh.geometry.boundingBox);
    if (box.isEmpty()) throw new Error(`No 3D mesh for muscle "${muscleId}"`);
    // Small muscles keep some of the body around them for orientation.
    const least = this.bounds.getSize(new Vector3()).y * 0.16;
    const size = box.getSize(new Vector3());
    box.expandByVector(new Vector3(Math.max(0, least - size.x) / 2, Math.max(0, least - size.y) / 2, 0));
    const place = this.placement(box, this.camera.position.clone().sub(this.controls.target), 1.5);
    // Aim a little below the muscle, so it sits in the upper part of the stage, clear of the sheet over the lower part.
    const drop = place.position.distanceTo(place.target) * Math.tan((FIELD_OF_VIEW * Math.PI) / 360) * SHEET_SHARE;
    const down = new Vector3(0, 1, 0).applyQuaternion(this.camera.quaternion).multiplyScalar(-drop);
    this.flyTo({ position: place.position.add(down), target: place.target.add(down) });
  }

  pose(): CameraPose {
    return { position: this.camera.position.toArray(), target: this.controls.target.toArray() };
  }

  setPose(pose: CameraPose): void {
    this.flight = null;
    this.camera.position.fromArray(pose.position);
    this.controls.target.fromArray(pose.target);
    this.controls.update();
    this.dirty = true;
  }

  setSize(width: number, height: number, pixelRatio: number): void {
    this.renderer.setPixelRatio(pixelRatio);
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.dirty = true;
  }

  // ---------- frames ----------

  /** One animation frame: advance fades and flights, and draw only if something changed. */
  private loop(time: number): void {
    const seconds = Math.min((time - this.lastTime) / 1000, 0.1);
    this.lastTime = time;
    this.stepFades(seconds);
    this.stepFlight(seconds);
    this.controls.update();
    if (this.dirty) {
      this.dirty = false;
      this.renderer.render(this.scene, this.camera);
    }
    this.frame = requestAnimationFrame(this.loop);
  }

  private stepFades(seconds: number): void {
    const step = seconds / FADE_SECONDS;
    for (const muscle of this.muscles) {
      const goal = LOOK_OPACITY[muscle.look];
      if (muscle.opacity === goal) continue;
      muscle.opacity = muscle.opacity < goal ? Math.min(goal, muscle.opacity + step) : Math.max(goal, muscle.opacity - step);
      this.paint(muscle);
      this.dirty = true;
    }
  }

  private stepFlight(seconds: number): void {
    const flight = this.flight;
    if (flight === null) return;
    flight.elapsed = Math.min(FLY_SECONDS, flight.elapsed + seconds);
    const t = easeInOut(flight.elapsed / FLY_SECONDS);
    this.camera.position.lerpVectors(flight.fromPosition, flight.toPosition, t);
    this.controls.target.lerpVectors(flight.fromTarget, flight.toTarget, t);
    this.dirty = true;
    if (flight.elapsed === FLY_SECONDS) this.flight = null;
  }

  dispose(): void {
    cancelAnimationFrame(this.frame);
    this.controls.dispose();
    for (const muscle of this.muscles) muscle.material.dispose();
    this.boneMaterial.dispose();
    this.cartilageMaterial.dispose();
    this.selectedBoneMaterial.dispose();
    this.renderer.dispose();
  }
}
