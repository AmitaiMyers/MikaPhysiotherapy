import generated from './generated/muscleImages.json';
import skeletonGenerated from './generated/boneImages.json';
import nerveGenerated from './generated/nerveImages.json';

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

/** A rendered picture in public/images/<folder>/. */
const assetUrl = (folder: 'muscles' | 'bones' | 'joints' | 'nerves', file: string) => `${import.meta.env.BASE_URL}images/${folder}/${file}.webp`;
const imageUrl = (file: string) => assetUrl('muscles', file);

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

// ---------- bones and joints ----------

/** Written by scripts/anatomy/render-bones.mjs: the view chosen for each bone and joint (absent: no mesh). */
const SKELETON_IMAGES = skeletonGenerated as { bones: Record<string, ImageView>; joints: Record<string, ImageView> };

export type SkeletonKind = 'bones' | 'joints';

/** The picture of a bone, or of a joint's bones, highlighted on the skeleton. */
export function skeletonImage(kind: SkeletonKind, id: string): MuscleImage | null {
  const view = SKELETON_IMAGES[kind][id];
  return view === undefined ? null : { url: assetUrl(kind, id), caption: VIEW_CAPTION[view], label: VIEW_LABEL[view] };
}

export function skeletonThumbnail(kind: SkeletonKind, id: string): string | null {
  return id in SKELETON_IMAGES[kind] ? assetUrl(kind, `${id}-thumb`) : null;
}

// ---------- nerves ----------

/** Written by scripts/anatomy/render-nerves.mjs: the view of each nerve, and whether the 3D model has the nerve itself (absent: no picture). */
const NERVE_IMAGES = nerveGenerated as Record<string, { view: ImageView; drawn: boolean }>;

/** The picture of a nerve on the skeleton with the muscles it supplies. */
export function nerveImage(nerveId: string): MuscleImage | null {
  const entry = NERVE_IMAGES[nerveId];
  if (entry === undefined) return null;
  const legend = entry.drawn ? 'nerve yellow, the muscles it supplies red' : 'the muscles it supplies in red (the nerve itself is not in the 3D model)';
  return { url: assetUrl('nerves', nerveId), caption: `${VIEW_CAPTION[entry.view]} — ${legend}`, label: VIEW_LABEL[entry.view] };
}

export function nerveThumbnail(nerveId: string): string | null {
  return nerveId in NERVE_IMAGES ? assetUrl('nerves', `${nerveId}-thumb`) : null;
}
