/**
 * Build-time page driven by render-images.mjs (Playwright). Not part of the app bundle.
 * Loads the model of the region given as ?region=… and exposes window.renderTool.
 */
import { MUSCLES } from '../../src/data';
import type { RegionId } from '../../src/data/types';
import { loadAnatomyModel } from '../../src/viewer/model';
import { AnatomyScene, muscleHasModel, REGION_VIEWS, type CameraView, type DisplayMode } from '../../src/viewer/scene';

interface RenderRequest {
  muscleId: string;
  view: CameraView;
  mode: DisplayMode;
  width: number;
  height: number;
  padding: number;
}

const canvas = document.getElementById('canvas') as HTMLCanvasElement;
const regionId = new URLSearchParams(location.search).get('region') as RegionId;
const regionMuscles = MUSCLES.filter((m) => m.regionId === regionId);
const model = await loadAnatomyModel(regionId);
const first = regionMuscles[0]?.id ?? '';
const scene = new AnatomyScene(canvas, model, { muscleId: first, mode: 'muscle', showOtherMuscles: true }, true);

function prepare({ muscleId, view, mode, width, height, padding }: RenderRequest): void {
  scene.setOptions({ muscleId, mode, showOtherMuscles: true });
  scene.setSize(width, height, 1);
  scene.frame(view, width / height, padding);
}

/** Views from below are only useful for muscles that face downwards (sole, pelvic floor). */
const INFERIOR_VIEW_GROUPS = new Set(['foot-plantar', 'pelvic-floor']);

const tool = {
  candidateViews(muscleId: string): CameraView[] {
    const muscle = regionMuscles.find((m) => m.id === muscleId);
    if (!muscle) throw new Error(`Unknown muscle ${muscleId}`);
    return REGION_VIEWS[regionId].filter((view) => view !== 'inferior' || INFERIOR_VIEW_GROUPS.has(muscle.groupId));
  },
  muscleIds: regionMuscles.filter((m) => muscleHasModel(model, m.id)).map((m) => m.id),
  coverage(request: RenderRequest): number {
    prepare(request);
    return scene.coverage();
  },
  image(request: RenderRequest): string {
    prepare(request);
    scene.render();
    return canvas.toDataURL('image/webp', 0.82);
  },
};

(window as unknown as { renderTool: typeof tool }).renderTool = tool;
