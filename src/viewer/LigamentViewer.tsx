import { useEffect, useRef, useState, type PointerEvent } from 'react';
import { Link } from 'react-router';
import { Vector2 } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Segmented } from '../components/Segmented';
import { Icon } from '../components/Icon';
import { getBone, getMuscle } from '../data';
import { ligamentBestView, ligamentXray } from '../data/images';
import { getLigament } from '../data/ligaments';
import { LigamentScene, LIGAMENT_COLOR, type PickedStructure } from './ligamentScene';
import { loadAnatomyModel, loadLigamentModel, type AnatomyModel } from './model';
import { REGION_VIEWS, VIEW_LABELS, type CameraView } from './scene';

/** A tap that moves further than this (CSS pixels) is a drag. */
const TAP_SLOP = 6;

/** Interactive 3D view of one ligament on the skeleton of its region: rotate, zoom, see through bone, tap to name. */
export default function LigamentViewer({ ligamentId }: { ligamentId: string }) {
  const regionId = getLigament(ligamentId).regionId;
  const [models, setModels] = useState<{ region: AnatomyModel; ligaments: AnatomyModel } | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    Promise.all([loadAnatomyModel(regionId), loadLigamentModel()]).then(
      ([region, ligaments]) => setModels({ region, ligaments }),
      (e: unknown) => setError(e instanceof Error ? e.message : String(e)),
    );
  }, [regionId]);
  if (error !== null) return <p className="empty">{error}. Connect to the internet once to download the 3D model (a few MB).</p>;
  if (models === null) return <p className="muted center">Downloading the 3D model of this region (a few MB, once)…</p>;
  if (!models.ligaments.parts.some((p) => p.ligamentId === ligamentId)) return <p className="empty">The open 3D atlas has no model of this structure.</p>;
  return <ViewerCanvas models={models} ligamentId={ligamentId} />;
}

function pickedName(picked: PickedStructure): { name: string; to: string } {
  if (picked.kind === 'ligament') return { name: getLigament(picked.id).name, to: `/ligaments/${picked.id}?tab=3d` };
  if (picked.kind === 'muscle') return { name: getMuscle(picked.id).name, to: `/muscles/${picked.id}` };
  return { name: getBone(picked.id).name, to: `/bones/${picked.id}` };
}

function ViewerCanvas({ models, ligamentId }: { models: { region: AnatomyModel; ligaments: AnatomyModel }; ligamentId: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<LigamentScene | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const ligament = getLigament(ligamentId);
  const views = REGION_VIEWS[ligament.regionId];
  // Start from the side the pictures use; "from above" has no 3D camera, so it starts from the front.
  const best = ligamentBestView(ligamentId);
  const [view, setView] = useState<CameraView>(views.find((v) => v === best) ?? 'anterior');
  const [showOthers, setShowOthers] = useState(true);
  const [showMuscles, setShowMuscles] = useState(false);
  const [seeThrough, setSeeThrough] = useState(ligamentXray(ligamentId));
  const [picked, setPicked] = useState<PickedStructure | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas === null) return;
    const scene = new LigamentScene(canvas, models.region, models.ligaments, { ligamentId, showOtherLigaments: true, showMuscles: false, seeThroughBones: ligamentXray(ligamentId) });
    const controls = new OrbitControls(scene.camera, canvas);
    controls.enableDamping = true;
    controls.addEventListener('change', () => scene.render());
    sceneRef.current = scene;
    controlsRef.current = controls;
    const resize = () => {
      scene.setSize(canvas.clientWidth, canvas.clientHeight, Math.min(window.devicePixelRatio, 2));
      scene.render();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    let frame = 0;
    const loop = () => {
      controls.update();
      frame = requestAnimationFrame(loop);
    };
    loop();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      controls.dispose();
      scene.dispose();
      sceneRef.current = null;
    };
  }, [models, ligamentId]);

  useEffect(() => {
    const scene = sceneRef.current;
    const controls = controlsRef.current;
    const canvas = canvasRef.current;
    if (scene === null || controls === null || canvas === null) return;
    scene.setOptions({ ligamentId, showOtherLigaments: showOthers, showMuscles, seeThroughBones: seeThrough });
    controls.target.copy(scene.frame(view, canvas.clientWidth / Math.max(canvas.clientHeight, 1)));
    controls.update();
    scene.render();
  }, [ligamentId, showOthers, showMuscles, seeThrough, view]);

  const down = useRef<{ x: number; y: number } | null>(null);
  const onPointerDown = (event: PointerEvent) => {
    down.current = { x: event.clientX, y: event.clientY };
  };
  const onPointerUp = (event: PointerEvent<HTMLCanvasElement>) => {
    const start = down.current;
    const scene = sceneRef.current;
    if (start === null || scene === null || Math.hypot(event.clientX - start.x, event.clientY - start.y) > TAP_SLOP) return;
    const rect = event.currentTarget.getBoundingClientRect();
    setPicked(scene.pick(new Vector2(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1)));
  };

  const pickedLink = picked === null ? null : pickedName(picked);
  return (
    <section className="viewer">
      <div className="viewer-stage">
        <canvas ref={canvasRef} className="viewer-canvas" onPointerDown={onPointerDown} onPointerUp={onPointerUp} aria-label="3D model; drag to rotate, pinch to zoom, tap a structure to name it" />
        {picked !== null && pickedLink !== null && (
          <div className="viewer-pick">
            {picked.kind === 'ligament' && picked.id === ligamentId ? (
              <span>{pickedLink.name}</span>
            ) : (
              <Link to={pickedLink.to}>
                {pickedLink.name} <Icon name="chevron" size={16} />
              </Link>
            )}
          </div>
        )}
      </div>
      <Segmented label="Camera" value={view} onChange={setView} options={views.map((id) => ({ value: id, label: VIEW_LABELS[id] }))} />
      <div className="viewer-options">
        <label className="toggle">
          <input type="checkbox" checked={seeThrough} onChange={(e) => setSeeThrough(e.target.checked)} />
          See-through bones
        </label>
        <label className="toggle">
          <input type="checkbox" checked={showOthers} onChange={(e) => setShowOthers(e.target.checked)} />
          Other ligaments (faded)
        </label>
        <label className="toggle">
          <input type="checkbox" checked={showMuscles} onChange={(e) => setShowMuscles(e.target.checked)} />
          Muscles (faded)
        </label>
      </div>
      <p className="muted small">
        <span className="swatch" style={{ background: LIGAMENT_COLOR }} /> {ligament.name}. Drag to rotate, pinch or scroll to zoom, tap a structure to name it. Model: Z-Anatomy (CC BY-SA 4.0), right side.
      </p>
    </section>
  );
}
