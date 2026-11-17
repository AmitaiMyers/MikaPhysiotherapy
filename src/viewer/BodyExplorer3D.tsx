import { useEffect, useRef, useState, type PointerEvent } from 'react';
import { Vector2 } from 'three';
import { BodyExplorer, BodyPoster, TargetDetails, TargetHeader } from '../components/BodyExplorer';
import { Icon } from '../components/Icon';
import { getMuscle } from '../data';
import { getTendon } from '../data/tendons';
import { required } from '../domain/assert';
import { BodyScene, type BodySide } from './bodyScene';
import { depthLabel, getExplorerState, muscleLook, rememberCamera, SKELETON_DEPTH, updateExplorer, useExplorerState, withDepth, withFocusToggled, withLooksReset, withFlightDone, withSeeThroughToggled, withTap } from './explorerState';
import { loadBodyParts, loadTendonModel, type ModelPart } from './model';

/** A tap that moves further than this (CSS pixels) is a drag and selects nothing. */
const TAP_SLOP = 6;

type Load = { status: 'loading' } | { status: 'ready'; parts: ModelPart[]; tendonParts: ModelPart[] } | { status: 'failed' };

const canDraw3D = () => document.createElement('canvas').getContext('webgl2') !== null;

/**
 * The home-screen body in live 3D: rotate and zoom, peel muscle layers, tap a muscle or bone, and
 * focus on a muscle or make it see-through. Until the model has arrived (a few MB, once) a still
 * picture stands in; without WebGL or the model, the tappable picture explorer is used.
 */
export default function BodyExplorer3D() {
  const [load, setLoad] = useState<Load>({ status: 'loading' });
  useEffect(() => {
    if (!canDraw3D()) return setLoad({ status: 'failed' });
    let current = true;
    Promise.all([loadBodyParts(), loadTendonModel()]).then(
      ([parts, tendons]) => current && setLoad({ status: 'ready', parts, tendonParts: tendons.parts }),
      () => current && setLoad({ status: 'failed' }),
    );
    return () => {
      current = false;
    };
  }, []);
  if (load.status === 'failed') return <BodyExplorer />;
  if (load.status === 'loading') return <BodyPoster />;
  return <Explorer parts={load.parts} tendonParts={load.tendonParts} />;
}

function Explorer({ parts, tendonParts }: { parts: ModelPart[]; tendonParts: ModelPart[] }) {
  const state = useExplorerState();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<BodyScene | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  // One scene per canvas; the camera is put back where it was left, and remembered on the way out.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas === null) return;
    const scene = new BodyScene(canvas, parts, tendonParts, window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    sceneRef.current = scene;
    const resize = () => scene.setSize(canvas.clientWidth, canvas.clientHeight, Math.min(window.devicePixelRatio, 2));
    resize();
    const remembered = getExplorerState().camera;
    if (remembered === null) scene.showWhole('front', true);
    else scene.setPose(remembered);
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    return () => {
      rememberCamera(scene.pose());
      observer.disconnect();
      scene.dispose();
      sceneRef.current = null;
    };
  }, [parts, tendonParts]);

  // Looks and selection follow the state; muscles fade between looks.
  useEffect(() => {
    sceneRef.current?.setLooks((muscleId) => muscleLook(state, muscleId));
  }, [state.depth, state.seeThrough, state.focused]);
  useEffect(() => {
    sceneRef.current?.setSelected(state.selected);
  }, [state.selected]);

  // Another page asked to show a tendon (or the muscle page's "Show on the 3D body"): fly to it once.
  useEffect(() => {
    const scene = sceneRef.current;
    if (!state.flyToSelected || scene === null) return;
    if (state.selected?.kind === 'tendon' && scene.hasTendon(state.selected.id)) scene.showTendon(state.selected.id);
    updateExplorer(withFlightDone);
  }, [state.flyToSelected, state.selected]);

  // A tap (not a drag) selects what is under the finger.
  const down = useRef<{ x: number; y: number } | null>(null);
  const onPointerDown = (event: PointerEvent) => {
    down.current = { x: event.clientX, y: event.clientY };
  };
  const onPointerUp = (event: PointerEvent<HTMLCanvasElement>) => {
    const start = down.current;
    const scene = sceneRef.current;
    down.current = null;
    if (start === null || scene === null || Math.hypot(event.clientX - start.x, event.clientY - start.y) > TAP_SLOP) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const ndc = new Vector2(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1);
    updateExplorer((s) => withTap(s, scene.pick(ndc)));
  };

  const flip = () => {
    const scene = sceneRef.current;
    if (scene === null) return;
    const side: BodySide = scene.facing() === 'front' ? 'back' : 'front';
    scene.showWhole(side);
  };
  const toggleFocus = (muscleId: string, show: (scene: BodyScene) => void) => {
    const focusing = state.focused !== muscleId;
    updateExplorer((s) => withFocusToggled(s, muscleId));
    if (focusing && sceneRef.current !== null) show(sceneRef.current);
  };

  const selected = state.selected;
  const changedLooks = state.seeThrough.length > 0 || state.focused !== null;
  return (
    <section className="body-explorer" aria-label="Interactive 3D body">
      <LayerControl depth={state.depth} />
      <div className="body-stage body-stage-3d">
        <canvas ref={canvasRef} className="body-canvas" onPointerDown={onPointerDown} onPointerUp={onPointerUp} aria-label="3D body. Drag to rotate, pinch to zoom, tap a muscle, tendon or bone to select it." />
        <div className="stage-corner">
          <button type="button" className="stage-button" aria-label="Turn the body around" onClick={flip}>
            <Icon name="rotate" size={20} />
          </button>
          <button type="button" className="stage-button" aria-label="Reset the view to the whole body" onClick={() => sceneRef.current?.showWhole('front')}>
            <Icon name="zoomOut" size={20} />
          </button>
        </div>
        {changedLooks && (
          <div className="look-chips">
            {state.focused !== null && (
              <button type="button" className="look-chip" onClick={() => updateExplorer((s) => withFocusToggled(s, state.focused as string))} aria-label={`Stop focusing on ${getMuscle(state.focused).name}`}>
                <Icon name="focus" size={16} /> {getMuscle(state.focused).name} <Icon name="close" size={14} />
              </button>
            )}
            {state.seeThrough.map((id) => (
              <button key={id} type="button" className="look-chip" onClick={() => updateExplorer((s) => withSeeThroughToggled(s, id))} aria-label={`Make ${getMuscle(id).name} solid again`}>
                <Icon name="eye" size={16} /> {getMuscle(id).name} <Icon name="close" size={14} />
              </button>
            ))}
            <button type="button" className="look-chip look-chip-reset" onClick={() => updateExplorer(withLooksReset)}>
              <Icon name="undo" size={16} /> Reset all
            </button>
          </div>
        )}
      </div>
      <p className="body-hint">Drag to rotate · pinch to zoom · tap a muscle, tendon or bone</p>
      <div aria-live="polite">
        {selected !== null && (
          <article className={`target-sheet ${detailsOpen ? '' : 'target-sheet-compact'}`}>
            <button type="button" className="icon-button target-close" aria-label="Close" onClick={() => updateExplorer((s) => withTap(s, null))}>
              <Icon name="close" size={18} />
            </button>
            <TargetHeader target={selected} />
            <div className="target-actions">
              {selected.kind === 'muscle' && (
                <>
                  <button type="button" className="button" aria-pressed={state.focused === selected.id} onClick={() => toggleFocus(selected.id, (scene) => scene.showMuscle(selected.id))}>
                    <Icon name="focus" size={18} /> Focus
                  </button>
                  <button type="button" className="button" aria-pressed={state.seeThrough.includes(selected.id)} onClick={() => updateExplorer((s) => withSeeThroughToggled(s, selected.id))}>
                    <Icon name="eye" size={18} /> See-through
                  </button>
                </>
              )}
              {selected.kind === 'tendon' && <TendonFocus tendonId={selected.id} focused={state.focused} onToggle={toggleFocus} />}
              <button type="button" className="button" aria-expanded={detailsOpen} onClick={() => setDetailsOpen((open) => !open)}>
                <Icon name="info" size={18} /> Details
              </button>
            </div>
            {detailsOpen && <TargetDetails target={selected} />}
          </article>
        )}
      </div>
    </section>
  );
}

/** Focus a tendon's muscle (its first, the one it is named after) and fly to the tendon. */
function TendonFocus({ tendonId, focused, onToggle }: { tendonId: string; focused: string | null; onToggle: (muscleId: string, show: (scene: BodyScene) => void) => void }) {
  const muscleId = required(getTendon(tendonId).muscleIds[0], `Tendon "${tendonId}" has no muscle`);
  return (
    <button type="button" className="button" aria-pressed={focused === muscleId} onClick={() => onToggle(muscleId, (scene) => scene.showTendon(tendonId))}>
      <Icon name="focus" size={18} /> Focus
    </button>
  );
}

/** Add or peel muscle layers: a slider from the bare skeleton (left) to all muscles (right), with a step button either side. */
function LayerControl({ depth }: { depth: number }) {
  const set = (value: number) => updateExplorer((s) => withDepth(s, value));
  return (
    <div className="layer-control">
      <button type="button" className="stage-button" aria-label="Remove a muscle layer" disabled={depth === SKELETON_DEPTH} onClick={() => set(depth + 1)}>
        <Icon name="minus" size={18} />
      </button>
      <label className="layer-slider">
        <span className="layer-label">
          <Icon name="layers" size={16} /> {depthLabel(depth)}
        </span>
        <input type="range" min={0} max={SKELETON_DEPTH} step={1} value={SKELETON_DEPTH - depth} onChange={(event) => set(SKELETON_DEPTH - Number(event.target.value))} aria-label="Muscle layers shown" aria-valuetext={depthLabel(depth)} />
      </label>
      <button type="button" className="stage-button" aria-label="Put a muscle layer back" disabled={depth === 0} onClick={() => set(depth - 1)}>
        <Icon name="plus" size={18} />
      </button>
    </div>
  );
}
