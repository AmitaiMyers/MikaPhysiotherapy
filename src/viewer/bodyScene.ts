import { AmbientLight, Box3, Color, DirectionalLight, Mesh, MeshStandardMaterial, PerspectiveCamera, Raycaster, Scene, Vector2, Vector3, WebGLRenderer } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { BodyTarget } from '../data/bodyMap';
import type { CameraPose, MuscleLook } from './explorerState';
import type { ModelPart } from './model';
import { getTendon } from '../data/tendons';

const COLORS = { muscle: '#b8463c', bone: '#ece2cd', cartilage: '#d9cfc0', tendon: '#f4f1e6', selected: '#26c4b5' } as const;
/** The most visible look among a tendon's muscles is its own look. */
const LOOK_RANK: Record<MuscleLook, number> = { solid: 3, glass: 2, ghost: 1, hidden: 0 };
/** A tap on a tendon lies on its muscle's surface: a tendon hit this close (cm) behind the first hit wins. */
const TENDON_PICK_SLACK = 0.6;

/** Opacity of each look. Glass and ghost muscles write no depth, so what lies beneath shows through. */
const LOOK_OPACITY: Record<MuscleLook, number> = { solid: 1, glass: 0.3, ghost: 0.06, hidden: 0 };
/** Seconds a muscle takes to fade between two looks, and the camera to fly to a new place. */
const FADE_SECONDS = 0.22;
const FLY_SECONDS = 0.45;
const FIELD_OF_VIEW = 30;
/** Share of the half-height of the view that the selection sheet covers at the bottom. */
const SHEET_SHARE = 0.4;

export type BodySide = 'front' | 'back';

/** A tendon piece drawn over its muscle; it takes the look of the most visible of its muscles. */
interface TendonMesh {
  tendonId: string;
  ownerIds: string[];
  mesh: Mesh;
  material: MeshStandardMaterial;
  opacity: number;
  look: MuscleLook;
}

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
  private readonly tendons: TendonMesh[] = [];
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

  constructor(canvas: HTMLCanvasElement, parts: ModelPart[], tendonParts: ModelPart[], instantMotion: boolean) {
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

    for (const part of tendonParts) {
      if (part.tendonId === null) throw new Error(`Tendon model part "${part.name}" has no tendon id`);
      // Carved pieces belong to one muscle; separate atlas tendons (e.g. the Achilles) to all of the tendon's muscles.
      const ownerIds = part.muscleId !== null ? [part.muscleId] : getTendon(part.tendonId).muscleIds;
      // Drawn slightly in front of the muscle surface it was cut from, so it never flickers against it.
      const material = new MeshStandardMaterial({ color: COLORS.tendon, roughness: 0.4, metalness: 0, emissive: new Color(COLORS.selected), emissiveIntensity: 0, transparent: true, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
      const mesh = new Mesh(part.geometry, material);
      this.tendons.push({ tendonId: part.tendonId, ownerIds, mesh, material, opacity: 1, look: 'solid' });
      this.scene.add(mesh);
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
    const present = new Set(this.muscleIds());
    for (const tendon of this.tendons) {
      const looks = tendon.ownerIds.filter((id) => present.has(id)).map(lookOf);
      tendon.look = looks.reduce<MuscleLook>((best, look) => (LOOK_RANK[look] > LOOK_RANK[best] ? look : best), 'hidden');
      if (this.instantMotion) tendon.opacity = LOOK_OPACITY[tendon.look];
      this.paint(tendon);
    }
    this.dirty = true;
  }

  /** Whether the 3D model has a tendon. */
  hasTendon(tendonId: string): boolean {
    return this.tendons.some((t) => t.tendonId === tendonId);
  }

  /** Highlight the selected muscle or bone. */
  setSelected(target: BodyTarget | null): void {
    for (const muscle of this.muscles) {
      const selected = target?.kind === 'muscle' && target.id === muscle.muscleId;
      muscle.material.emissiveIntensity = selected ? 0.55 : 0;
      muscle.material.color.copy(selected ? new Color(COLORS.selected).lerp(muscle.base, 0.45) : muscle.base);
    }
    for (const tendon of this.tendons) {
      const selected = target?.kind === 'tendon' && target.id === tendon.tendonId;
      tendon.material.emissiveIntensity = selected ? 0.6 : 0;
      tendon.material.color.set(selected ? COLORS.selected : COLORS.tendon);
    }
    for (const bone of this.bones) {
      if (bone.boneId === null) continue;
      bone.mesh.material = target?.kind === 'bone' && target.id === bone.boneId ? this.selectedBoneMaterial : this.boneMaterial;
    }
    this.dirty = true;
  }

  /** Apply a muscle's or tendon's current opacity to its material. Only a fully solid one writes depth. */
  private paint(muscle: MuscleMesh | TendonMesh): void {
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
    const tendonOf = new Map<Mesh, string>(this.tendons.filter((t) => t.look === 'solid').map((t) => [t.mesh, t.tendonId]));
    const hits = this.raycaster.intersectObjects([...muscleOf.keys(), ...boneOf.keys(), ...tendonOf.keys()], false);
    const hit = hits[0];
    if (hit === undefined) return null;
    const tendonHit = hits.find((h) => tendonOf.has(h.object as Mesh) && h.distance <= hit.distance + TENDON_PICK_SLACK);
    if (tendonHit !== undefined) return { kind: 'tendon', id: tendonOf.get(tendonHit.object as Mesh) as string };
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
    this.showMeshes(this.muscles.filter((m) => m.muscleId === muscleId).map((m) => m.mesh), `muscle "${muscleId}"`);
  }

  /**
   * Fly to a tendon from a side it can be seen from: the current direction if nothing solid is in the
   * way, else the front, back or either side (the Achilles, say, hides behind the tibia from the front).
   */
  showTendon(tendonId: string): void {
    const meshes = this.tendons.filter((t) => t.tendonId === tendonId).map((t) => t.mesh);
    this.showMeshes(meshes, `tendon "${tendonId}"`, this.clearView(meshes));
  }

  /** The first view direction, of the current one and the four sides, from which a point of the meshes is the first solid thing hit. */
  private clearView(meshes: Mesh[]): Vector3 {
    const current = this.camera.position.clone().sub(this.controls.target).normalize();
    const sides = [new Vector3(0, 0.05, 1), new Vector3(0, 0.05, -1), new Vector3(1, 0.05, 0), new Vector3(-1, 0.05, 0)].map((v) => v.normalize());
    const solid = [...this.muscles.filter((m) => m.look === 'solid').map((m) => m.mesh), ...this.bones.map((b) => b.mesh), ...meshes];
    const point = surfacePointNearCentre(meshes);
    const far = this.bounds.getSize(new Vector3()).length();
    const seenFrom = (direction: Vector3) => {
      this.raycaster.set(point.clone().addScaledVector(direction, far), direction.clone().negate());
      const hit = this.raycaster.intersectObjects(solid, false)[0];
      return hit !== undefined && meshes.includes(hit.object as Mesh);
    };
    return [current, ...sides].find(seenFrom) ?? current;
  }

  private showMeshes(meshes: Mesh[], what: string, direction = this.camera.position.clone().sub(this.controls.target)): void {
    const box = new Box3();
    for (const mesh of meshes) {
      mesh.geometry.computeBoundingBox();
      if (mesh.geometry.boundingBox !== null) box.union(mesh.geometry.boundingBox);
    }
    if (box.isEmpty()) throw new Error(`No 3D mesh for ${what}`);
    // Small muscles keep some of the body around them for orientation.
    const least = this.bounds.getSize(new Vector3()).y * 0.16;
    const size = box.getSize(new Vector3());
    box.expandByVector(new Vector3(Math.max(0, least - size.x) / 2, Math.max(0, least - size.y) / 2, 0));
    const place = this.placement(box, direction, 1.5);
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
    for (const muscle of [...this.muscles, ...this.tendons]) {
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
    for (const muscle of [...this.muscles, ...this.tendons]) muscle.material.dispose();
    this.boneMaterial.dispose();
    this.cartilageMaterial.dispose();
    this.selectedBoneMaterial.dispose();
    this.renderer.dispose();
  }
}

/** The vertex of the meshes nearest the centre of their bounds: a point on the surface, even for a curved tendon. */
function surfacePointNearCentre(meshes: Mesh[]): Vector3 {
  const box = new Box3();
  for (const mesh of meshes) box.expandByObject(mesh);
  const centre = box.getCenter(new Vector3());
  const vertex = new Vector3();
  let best: Vector3 | null = null;
  for (const mesh of meshes) {
    const positions = mesh.geometry.getAttribute('position');
    for (let i = 0; i < positions.count; i++) {
      vertex.fromBufferAttribute(positions, i);
      if (best === null || vertex.distanceToSquared(centre) < best.distanceToSquared(centre)) best = vertex.clone();
    }
  }
  if (best === null) throw new Error('No vertices to look at');
  return best;
}
