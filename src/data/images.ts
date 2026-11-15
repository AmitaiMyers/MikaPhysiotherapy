import generated from './generated/muscleImages.json';
import skeletonGenerated from './generated/boneImages.json';
import nerveGenerated from './generated/nerveImages.json';
import ligamentGenerated from './generated/ligamentImages.json';

export type ImageView = 'anterior' | 'posterior' | 'lateral' | 'medial' | 'inferior' | 'superior';

/** Muscles are pictured from the four sides and from below (never from above). */
export type MuscleView = Exclude<ImageView, 'superior'>;

interface ImageEntry {
  views: MuscleView[];
  attachmentsView: MuscleView | null;
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
  superior: 'Above',
};

const VIEW_CAPTION: Record<ImageView, string> = {
  anterior: 'Anterior view',
  posterior: 'Posterior view',
  lateral: 'Lateral view',
  medial: 'Medial view',
  inferior: 'Inferior view (from below)',
  superior: 'Superior view (from above)',
};

/** A rendered picture in public/images/<folder>/. */
const assetUrl = (folder: 'muscles' | 'bones' | 'joints' | 'nerves' | 'ligaments', file: string) => `${import.meta.env.BASE_URL}images/${folder}/${file}.webp`;
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
export function bestView(muscleId: string): MuscleView {
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

// ---------- ligaments ----------

/** Written by scripts/anatomy/render-ligaments.mjs: the views of each structure, and whether the bones are drawn see-through. */
const LIGAMENT_IMAGES = ligamentGenerated as Record<string, { views: ImageView[]; xray: boolean }>;

/** The pictures of a ligament (or capsule, meniscus, disc) highlighted on the skeleton, best view first. */
export function ligamentViews(ligamentId: string): MuscleImage[] {
  const entry = LIGAMENT_IMAGES[ligamentId];
  if (entry === undefined) return [];
  const legend = entry.xray ? ' — bones see-through' : '';
  return entry.views.map((view) => ({ url: assetUrl('ligaments', `${ligamentId}-${view}`), caption: `${VIEW_CAPTION[view]}${legend}`, label: VIEW_LABEL[view] }));
}

export function ligamentThumbnail(ligamentId: string): string | null {
  return ligamentId in LIGAMENT_IMAGES ? assetUrl('ligaments', `${ligamentId}-thumb`) : null;
}

/** Whether the structure lies inside the joint, hidden by bone from every side (its pictures show the bones see-through). */
export function ligamentXray(ligamentId: string): boolean {
  return LIGAMENT_IMAGES[ligamentId]?.xray === true;
}

/** The side a ligament shows best from (its first picture's view), or the front when it has no picture. */
export function ligamentBestView(ligamentId: string): ImageView {
  return LIGAMENT_IMAGES[ligamentId]?.views[0] ?? 'anterior';
}
