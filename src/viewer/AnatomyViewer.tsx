import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { Vector2 } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { findMuscle } from '../data';
import { bestView } from '../data/images';
import { loadAnatomyModel, type AnatomyModel } from './model';
import { AnatomyScene, COLORS, muscleHasModel, type CameraView, type DisplayMode } from './scene';

const VIEWS: { id: CameraView; label: string }[] = [
  { id: 'anterior', label: 'Front' },
  { id: 'posterior', label: 'Back' },
  { id: 'lateral', label: 'Side' },
];

/** Interactive 3D view of one muscle: rotate, zoom, show attachments, tap other muscles. */
export default function AnatomyViewer({ muscleId }: { muscleId: string }) {
  const [model, setModel] = useState<AnatomyModel | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    loadAnatomyModel().then(setModel, (e: unknown) => setError(e instanceof Error ? e.message : String(e)));
  }, []);
  if (error) return <p className="empty">{error}. Connect to the internet once to download the 3D model (about 3 MB).</p>;
  if (!model) return <p className="muted center">Downloading 3D model (about 3 MB, once)…</p>;
  if (!muscleHasModel(model, muscleId)) return <p className="empty">No open 3D model exists for this muscle.</p>;
  return <ViewerCanvas model={model} muscleId={muscleId} />;
}

function ViewerCanvas({ model, muscleId }: { model: AnatomyModel; muscleId: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<AnatomyScene | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const [mode, setMode] = useState<DisplayMode>('muscle');
  const [showOthers, setShowOthers] = useState(true);
  const [view, setView] = useState<CameraView>(bestView(muscleId));
  const [picked, setPicked] = useState<string | null>(null);

  // Create the renderer once per canvas.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const scene = new AnatomyScene(canvas, model, { muscleId, mode: 'muscle', showOtherMuscles: true });
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
  }, [model]);

  // Apply display options and re-frame the camera when the muscle, mode or view changes.
  useEffect(() => {
    const scene = sceneRef.current;
    const controls = controlsRef.current;
    const canvas = canvasRef.current;
    if (!scene || !controls || !canvas) return;
    scene.setOptions({ muscleId, mode, showOtherMuscles: showOthers });
    const target = scene.frame(view, canvas.clientWidth / Math.max(canvas.clientHeight, 1));
    controls.target.copy(target);
    controls.update();
    scene.render();
  }, [muscleId, mode, showOthers, view]);

  // Tap (not drag) on a muscle to identify it.
  const down = useRef<{ x: number; y: number } | null>(null);
  const onPointerDown = (event: React.PointerEvent) => {
    down.current = { x: event.clientX, y: event.clientY };
  };
  const onPointerUp = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const start = down.current;
    const scene = sceneRef.current;
    if (!start || !scene || Math.hypot(event.clientX - start.x, event.clientY - start.y) > 6) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const ndc = new Vector2(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1);
    setPicked(scene.pickMuscle(ndc));
  };

  const pickedMuscle = picked ? findMuscle(picked) : undefined;
  return (
    <section className="viewer">
      <div className="viewer-stage">
        <canvas ref={canvasRef} className="viewer-canvas" onPointerDown={onPointerDown} onPointerUp={onPointerUp} aria-label="3D model; drag to rotate, pinch to zoom" />
        {pickedMuscle && (
          <div className="viewer-pick">
            {pickedMuscle.id === muscleId ? (
              <span>{pickedMuscle.name}</span>
            ) : (
              <Link to={`/muscles/${pickedMuscle.id}?tab=3d`}>{pickedMuscle.name} ›</Link>
            )}
          </div>
        )}
      </div>
      <div className="segmented" role="group" aria-label="Camera">
        {VIEWS.map((v) => (
          <button key={v.id} type="button" className={v.id === view ? 'segment-active' : ''} aria-pressed={v.id === view} onClick={() => setView(v.id)}>
            {v.label}
          </button>
        ))}
      </div>
      <div className="viewer-options">
        <label className="toggle">
          <input type="checkbox" checked={mode === 'attachments'} onChange={(e) => setMode(e.target.checked ? 'attachments' : 'muscle')} />
          Show origin <span className="swatch" style={{ background: COLORS.origin }} /> &amp; insertion <span className="swatch" style={{ background: COLORS.insertion }} />
        </label>
        <label className="toggle">
          <input type="checkbox" checked={showOthers} disabled={mode === 'attachments'} onChange={(e) => setShowOthers(e.target.checked)} />
          Other muscles (faded)
        </label>
      </div>
      <p className="muted small">Drag to rotate, pinch or scroll to zoom, tap a muscle to name it. Model: Z-Anatomy (CC BY-SA 4.0), right upper limb.</p>
    </section>
  );
}
