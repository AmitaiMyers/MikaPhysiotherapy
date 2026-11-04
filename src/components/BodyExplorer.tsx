import { useEffect, useRef, useState, type MouseEvent } from 'react';
import { Link } from 'react-router';
import { getBone, getJoint, getMuscle, getNerve } from '../data';
import { BODY_LAYER_LABELS, BODY_SIZE, bodyIdMapUrl, bodyImageUrl, bodyTarget, isVisible, targetIndex, type BodyLayer, type BodyTarget, type BodyView } from '../data/bodyMap';
import { attachmentsOnBone, formatRoots } from '../domain/relations';
import { Icon } from './Icon';

const { width: W, height: H } = BODY_SIZE;
/** How far (in image pixels) a tap may miss a thin structure and still pick it. */
const TAP_TOLERANCE = 10;

/** ID maps decoded once per view and layer. */
const idMaps = new Map<string, Promise<Uint8ClampedArray>>();

function loadIdMap(view: BodyView, layer: BodyLayer): Promise<Uint8ClampedArray> {
  const key = `${view}-${layer}`;
  let pending = idMaps.get(key);
  if (pending === undefined) {
    pending = new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = W;
        canvas.height = H;
        const context = canvas.getContext('2d', { willReadFrequently: true });
        if (context === null) return reject(new Error('No 2D canvas'));
        context.drawImage(image, 0, 0);
        resolve(context.getImageData(0, 0, W, H).data);
      };
      image.onerror = () => reject(new Error('The body map could not be loaded'));
      image.src = bodyIdMapUrl(view, layer);
    });
    idMaps.set(key, pending);
  }
  return pending;
}

const indexAt = (data: Uint8ClampedArray, x: number, y: number) => {
  const i = (y * W + x) * 4;
  return (data[i] ?? 0) + (data[i + 1] ?? 0) * 256;
};

/** The structure at a pixel, or the nearest one within the tap tolerance. */
function pick(data: Uint8ClampedArray, x: number, y: number): number {
  for (let r = 0; r <= TAP_TOLERANCE; r += 2) {
    for (let dy = -r; dy <= r; dy += 2) {
      for (let dx = -r; dx <= r; dx += 2) {
        const px = x + dx;
        const py = y + dy;
        if (px < 0 || py < 0 || px >= W || py >= H) continue;
        const index = indexAt(data, px, py);
        if (index !== 0) return index;
      }
    }
  }
  return 0;
}

/** Paint the selected structure: a translucent fill with a solid outline. */
function paintSelection(canvas: HTMLCanvasElement, data: Uint8ClampedArray | null, index: number): void {
  const context = canvas.getContext('2d');
  if (context === null) return;
  context.clearRect(0, 0, W, H);
  if (data === null || index === 0) return;
  const overlay = context.createImageData(W, H);
  for (let y = 1; y < H - 1; y++) {
    for (let x = 1; x < W - 1; x++) {
      if (indexAt(data, x, y) !== index) continue;
      const edge = indexAt(data, x - 1, y) !== index || indexAt(data, x + 1, y) !== index || indexAt(data, x, y - 1) !== index || indexAt(data, x, y + 1) !== index;
      const o = (y * W + x) * 4;
      // Teal fill with a white outline, readable over red muscle and pale bone alike.
      overlay.data[o] = edge ? 255 : 38;
      overlay.data[o + 1] = edge ? 255 : 196;
      overlay.data[o + 2] = edge ? 255 : 181;
      overlay.data[o + 3] = edge ? 255 : 170;
    }
  }
  context.putImageData(overlay, 0, 0);
}

const VIEW_LABELS: Record<BodyView, string> = { front: 'Front', back: 'Back' };

/** The home-screen body: tap a muscle or bone to highlight it and see its key facts. */
export function BodyExplorer() {
  const [view, setView] = useState<BodyView>('front');
  const [layer, setLayer] = useState<BodyLayer>('superficial');
  const [selected, setSelected] = useState<BodyTarget | null>(null);
  const [zoomed, setZoomed] = useState(false);
  const [data, setData] = useState<Uint8ClampedArray | null>(null);
  const overlay = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let current = true;
    setData(null);
    void loadIdMap(view, layer).then((map) => {
      if (current) setData(map);
    });
    return () => {
      current = false;
    };
  }, [view, layer]);

  const selectedIndex = selected === null ? 0 : targetIndex(selected);
  useEffect(() => {
    if (overlay.current !== null) paintSelection(overlay.current, data, selectedIndex);
  }, [data, selectedIndex]);

  const onTap = (event: MouseEvent<HTMLDivElement>) => {
    if (data === null) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = Math.floor(((event.clientX - rect.left) / rect.width) * W);
    const y = Math.floor(((event.clientY - rect.top) / rect.height) * H);
    const target = bodyTarget(pick(data, x, y));
    setSelected(target === null || (selected !== null && target.kind === selected.kind && target.id === selected.id) ? null : target);
  };

  const hiddenHere = selected !== null && !isVisible(selected, view, layer);

  return (
    <section className="body-explorer" aria-label="Interactive body">
      <div className="body-controls">
        <div className="segmented on-stage" role="group" aria-label="Layer">
          {(Object.keys(BODY_LAYER_LABELS) as BodyLayer[]).map((l) => (
            <button key={l} type="button" className={layer === l ? 'segment-active' : ''} aria-pressed={layer === l} onClick={() => setLayer(l)}>
              {BODY_LAYER_LABELS[l]}
            </button>
          ))}
        </div>
        <div className="body-buttons">
          <button type="button" className="stage-button" aria-label={`Show the ${view === 'front' ? 'back' : 'front'}`} onClick={() => setView(view === 'front' ? 'back' : 'front')}>
            <Icon name="rotate" size={20} />
            <span className="stage-button-label">{VIEW_LABELS[view === 'front' ? 'back' : 'front']}</span>
          </button>
          <button type="button" className="stage-button" aria-label={zoomed ? 'Zoom out' : 'Zoom in'} aria-pressed={zoomed} onClick={() => setZoomed((z) => !z)}>
            <Icon name={zoomed ? 'zoomOut' : 'zoomIn'} size={20} />
          </button>
        </div>
      </div>
      <div className={`body-stage ${zoomed ? 'body-stage-zoomed' : ''}`}>
        <div className="body-figure" style={{ aspectRatio: `${W} / ${H}` }} onClick={onTap} role="presentation">
          <img
            src={bodyImageUrl(view, layer)}
            alt={`Human body, ${VIEW_LABELS[view].toLowerCase()} view, ${BODY_LAYER_LABELS[layer].toLowerCase()}. Tap a structure to see it.`}
            width={W}
            height={H}
            draggable={false}
          />
          <canvas ref={overlay} width={W} height={H} className="body-overlay" aria-hidden="true" />
        </div>
      </div>
      <p className="body-hint">{layer === 'skeleton' ? 'Tap a bone' : 'Muscles on the body’s right side, bones on the left — tap to explore'}</p>
      <div aria-live="polite">{selected !== null && <TargetCard target={selected} hiddenHere={hiddenHere} onClose={() => setSelected(null)} />}</div>
    </section>
  );
}

function TargetCard({ target, hiddenHere, onClose }: { target: BodyTarget; hiddenHere: boolean; onClose: () => void }) {
  return (
    <article className="target-sheet">
      <button type="button" className="icon-button target-close" aria-label="Close" onClick={onClose}>
        <Icon name="close" size={18} />
      </button>
      {target.kind === 'muscle' ? <MuscleSummary id={target.id} /> : <BoneSummary id={target.id} />}
      {hiddenHere && <p className="muted small">Not visible in this view — switch side or layer to see it highlighted.</p>}
    </article>
  );
}

function MuscleSummary({ id }: { id: string }) {
  const muscle = getMuscle(id);
  const prime = muscle.actions.filter((a) => a.role === 'prime').slice(0, 3);
  return (
    <>
      <span className="target-kind">Muscle{muscle.layer ? ` · ${muscle.layer}` : ''}</span>
      <h3 className="target-name">{muscle.name}</h3>
      <p className="small">{muscle.summary}</p>
      <dl className="fact-list">
        <div>
          <dt>Nerve</dt>
          <dd>{muscle.innervation.map((s) => `${getNerve(s.nerveId).name} (${formatRoots(s.roots)})`).join('; ')}</dd>
        </div>
        {prime.length > 0 && (
          <div>
            <dt>Main actions</dt>
            <dd>{prime.map((a) => `${getJoint(a.jointId).name.replace(/ joint$/, '')}: ${a.movement}`).join(' · ')}</dd>
          </div>
        )}
      </dl>
      <div className="button-row">
        <Link to={`/muscles/${id}`} className="button button-primary">
          Open muscle
        </Link>
        <Link to={`/muscles/${id}?tab=exercises`} className="button">
          Exercises
        </Link>
      </div>
    </>
  );
}

function BoneSummary({ id }: { id: string }) {
  const bone = getBone(id);
  const { origins, insertions } = attachmentsOnBone(id);
  return (
    <>
      <span className="target-kind">Bone</span>
      <h3 className="target-name">{bone.name}</h3>
      <dl className="fact-list">
        <div>
          <dt>Muscles arising</dt>
          <dd>{origins.length === 0 ? '—' : origins.slice(0, 6).map((m) => m.name).join(', ') + (origins.length > 6 ? ` +${origins.length - 6}` : '')}</dd>
        </div>
        <div>
          <dt>Muscles inserting</dt>
          <dd>{insertions.length === 0 ? '—' : insertions.slice(0, 6).map((m) => m.name).join(', ') + (insertions.length > 6 ? ` +${insertions.length - 6}` : '')}</dd>
        </div>
      </dl>
      <div className="button-row">
        <Link to={`/bones/${id}`} className="button button-primary">
          Open bone
        </Link>
      </div>
    </>
  );
}
