import generated from './generated/muscleImages.json';

export type ImageView = 'anterior' | 'posterior' | 'lateral' | 'medial' | 'inferior';

interface ImageEntry {
  views: ImageView[];
  attachmentsView: ImageView | null;
}

/** Written by scripts/anatomy/render-images.mjs; muscles without a 3D mesh are absent. */
const IMAGES = generated as Record<string, ImageEntry>;

export interface MuscleImage {
  url: string;
  caption: string;
  /** Short label for view switchers. */
  label: string;
}

const VIEW_LABEL: Record<ImageView, string> = {
  anterior: 'Anterior',
  posterior: 'Posterior',
  lateral: 'Lateral',
  medial: 'Medial',
  inferior: 'Below',
};

const VIEW_CAPTION: Record<ImageView, string> = {
  anterior: 'Anterior view',
  posterior: 'Posterior view',
  lateral: 'Lateral view',
  medial: 'Medial view',
  inferior: 'Inferior view (from below)',
};

const imageUrl = (file: string) => `${import.meta.env.BASE_URL}images/muscles/${file}.webp`;

export function hasImages(muscleId: string): boolean {
  return muscleId in IMAGES;
}

export function muscleViews(muscleId: string): MuscleImage[] {
  const entry = IMAGES[muscleId];
  if (!entry) return [];
  return entry.views.map((view) => ({ url: imageUrl(`${muscleId}-${view}`), caption: VIEW_CAPTION[view], label: VIEW_LABEL[view] }));
}

export function attachmentImage(muscleId: string): MuscleImage | null {
  const entry = IMAGES[muscleId];
  if (!entry || entry.attachmentsView === null) return null;
  return { url: imageUrl(`${muscleId}-attachments`), caption: `${VIEW_CAPTION[entry.attachmentsView]} — origin areas red, insertion areas blue`, label: 'Attachments' };
}

export function thumbnailUrl(muscleId: string): string | null {
  return hasImages(muscleId) ? imageUrl(`${muscleId}-thumb`) : null;
}

/** The view that shows most of the muscle (used as the 3D viewer's starting camera). */
export function bestView(muscleId: string): ImageView {
  return IMAGES[muscleId]?.views[0] ?? 'anterior';
}
