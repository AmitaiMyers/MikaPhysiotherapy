/**
 * Build-time page driven by render-images.mjs (Playwright). Not part of the app bundle.
 * Exposes window.renderTool once the model has loaded.
 */
import { MUSCLES } from '../../src/data';
import { loadAnatomyModel } from '../../src/viewer/model';
import { AnatomyScene, muscleHasModel, type CameraView, type DisplayMode } from '../../src/viewer/scene';

interface RenderRequest {
  muscleId: string;
  view: CameraView;
  mode: DisplayMode;
  width: number;
  height: number;
  padding: number;
}

const canvas = document.getElementById('canvas') as HTMLCanvasElement;
const model = await loadAnatomyModel();
const first = MUSCLES[0]?.id ?? '';
const scene = new AnatomyScene(canvas, model, { muscleId: first, mode: 'muscle', showOtherMuscles: true }, true);

function prepare({ muscleId, view, mode, width, height, padding }: RenderRequest): void {
  scene.setOptions({ muscleId, mode, showOtherMuscles: true });
  scene.setSize(width, height, 1);
  scene.frame(view, width / height, padding);
}

const tool = {
  muscleIds: MUSCLES.filter((m) => muscleHasModel(model, m.id)).map((m) => m.id),
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
